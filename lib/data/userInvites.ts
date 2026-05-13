import "server-only";

import { createHash, randomBytes } from "crypto";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import type { DocumentData, DocumentReference } from "firebase-admin/firestore";
import { collections } from "@/lib/constants/collections";
import { getAdminAuth, getAdminFirestore, syncUserClaims } from "@/lib/firebaseAdmin";
import { SUPER_ADMIN } from "@/types/auth";
import type { AdminSession } from "@/lib/auth";
import type { InvitableUserRole, UserInvite } from "@/types/invites";
import { serializeData } from "./utils";

const INVITE_TOKEN_BYTES = 32;
const DEFAULT_EXPIRES_IN_DAYS = 7;
const MAX_EXPIRES_IN_DAYS = 30;
const INVITE_PATH = "/admin/invite";

export type InviteErrorCode =
  | "INVALID_TOKEN"
  | "INVITE_NOT_FOUND"
  | "INVITE_EXPIRED"
  | "INVITE_ACCEPTED"
  | "INVITE_REVOKED"
  | "EMAIL_MISMATCH"
  | "EMAIL_UNVERIFIED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "DUPLICATE_PENDING_INVITE"
  | "INVITE_CREATE_FAILED"
  | "INVITE_ACCEPT_FAILED"
  | "INVITE_REVOKE_FAILED"
  | "CLAIMS_SYNC_FAILED";

export class InviteFlowError extends Error {
  code: InviteErrorCode;
  status: number;

  constructor(code: InviteErrorCode, message: string, status = 400) {
    super(message);
    this.name = "InviteFlowError";
    this.code = code;
    this.status = status;
  }
}

export type InvitePublicView = {
  id: string;
  email: string;
  name: string | null;
  role: InvitableUserRole;
  status: UserInvite["status"];
  expiresAt: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  emailSentAt?: string | null;
};

export type CreateUserInviteInput = {
  email: string;
  name?: string | null;
  role: InvitableUserRole;
  expiresInDays?: number;
  actor: AdminSession;
  origin: string;
};

export type CreateUserInviteResult = {
  invite: InvitePublicView;
  delivery:
    | {
        method: "email";
        emailSent: true;
        resendMessageId: string | null;
      }
    | {
        method: "copy_link";
        emailSent: false;
        inviteLink: string;
        reason: "resend_not_configured" | "resend_failed";
        emailError?: string;
      };
};

export type AcceptUserInviteInput = {
  token: string;
  idToken: string;
  name?: string | null;
};

export type AcceptInviteWithPasswordInput = {
  token: string;
  password: string;
  name?: string | null;
};

export type AcceptUserInviteResult = {
  invite: InvitePublicView;
  user: {
    uid: string;
    email: string;
    name: string;
    role: InvitableUserRole;
    approved: true;
    disabled: false;
  };
};

type InviteRecord = UserInvite & { id: string };

type ResendResult =
  | { configured: false }
  | { configured: true; sent: true; messageId: string | null }
  | { configured: true; sent: false; error: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function cleanName(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  return trimmed ? trimmed : null;
}

export function generateInviteToken(): string {
  return randomBytes(INVITE_TOKEN_BYTES).toString("base64url");
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function safeExpiresInDays(expiresInDays: number | undefined): number {
  if (!Number.isFinite(expiresInDays)) {
    return DEFAULT_EXPIRES_IN_DAYS;
  }

  return Math.min(Math.max(Math.trunc(expiresInDays ?? DEFAULT_EXPIRES_IN_DAYS), 1), MAX_EXPIRES_IN_DAYS);
}

function buildInviteLink(origin: string, token: string): string {
  const baseUrl = origin.replace(/\/$/, "");
  return `${baseUrl}${INVITE_PATH}?token=${encodeURIComponent(token)}`;
}

function dateFromFirestoreValue(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function isExpired(invite: Pick<UserInvite, "expiresAt">, now = new Date()): boolean {
  const expiresAt = dateFromFirestoreValue(invite.expiresAt);
  return Boolean(expiresAt && expiresAt.getTime() <= now.getTime());
}

function toInviteRecord(id: string, data: DocumentData): InviteRecord {
  return {
    id,
    ...(data as UserInvite),
  };
}

function toPublicInvite(invite: InviteRecord): InvitePublicView {
  const serialized = serializeData(invite);

  return {
    id: serialized.id,
    email: serialized.email,
    name: serialized.name,
    role: serialized.role,
    status: serialized.status,
    expiresAt: serialized.expiresAt ?? null,
    createdAt: serialized.createdAt ?? null,
    updatedAt: serialized.updatedAt ?? null,
    acceptedAt: serialized.acceptedAt ?? null,
    revokedAt: serialized.revokedAt ?? null,
    emailSentAt: serialized.emailSentAt ?? null,
  };
}

function inviteStatusError(status: UserInvite["status"]): InviteFlowError {
  if (status === "accepted") {
    return new InviteFlowError("INVITE_ACCEPTED", "This invite has already been accepted.", 409);
  }

  if (status === "revoked") {
    return new InviteFlowError("INVITE_REVOKED", "This invite has been revoked.", 410);
  }

  if (status === "expired") {
    return new InviteFlowError("INVITE_EXPIRED", "This invite has expired.", 410);
  }

  return new InviteFlowError("INVALID_TOKEN", "This invite is not available.", 400);
}

async function findInviteByToken(token: string): Promise<{
  ref: DocumentReference;
  invite: InviteRecord;
} | null> {
  const tokenHash = hashInviteToken(token);
  const snapshot = await getAdminFirestore()
    .collection(collections.userInvites)
    .where("tokenHash", "==", tokenHash)
    .limit(1)
    .get();

  const doc = snapshot.docs[0];

  if (!doc) {
    return null;
  }

  return {
    ref: doc.ref,
    invite: toInviteRecord(doc.id, doc.data()),
  };
}

async function getValidPendingInviteByToken(token: string): Promise<{
  ref: DocumentReference;
  invite: InviteRecord;
}> {
  if (!token.trim()) {
    throw new InviteFlowError("INVALID_TOKEN", "Invite token is required.", 400);
  }

  const match = await findInviteByToken(token);

  if (!match) {
    throw new InviteFlowError("INVITE_NOT_FOUND", "Invite not found.", 404);
  }

  if (match.invite.status !== "pending") {
    throw inviteStatusError(match.invite.status);
  }

  if (isExpired(match.invite)) {
    await match.ref.set(
      {
        status: "expired",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    throw new InviteFlowError("INVITE_EXPIRED", "This invite has expired.", 410);
  }

  return match;
}

async function findPendingInviteForEmail(email: string): Promise<InviteRecord | null> {
  const snapshot = await getAdminFirestore()
    .collection(collections.userInvites)
    .where("email", "==", email)
    .limit(10)
    .get();

  for (const doc of snapshot.docs) {
    const invite = toInviteRecord(doc.id, doc.data());
    if (invite.status === "pending" && !isExpired(invite)) {
      return invite;
    }
  }

  return null;
}

async function assertEmailIsNotSuperAdmin(email: string): Promise<void> {
  const snapshot = await getAdminFirestore()
    .collection(collections.users)
    .where("email", "==", email)
    .limit(1)
    .get();

  const existing = snapshot.docs[0]?.data();

  if (existing?.role === SUPER_ADMIN) {
    throw new InviteFlowError(
      "FORBIDDEN",
      "SUPER_ADMIN accounts cannot be modified through invites.",
      403,
    );
  }
}

async function sendInviteEmail(params: {
  to: string;
  role: InvitableUserRole;
  inviteLink: string;
  expiresAt: Date;
}): Promise<ResendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return { configured: false };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Stonehill SDA Church <onboarding@resend.dev>";

  const subject = "Your Stonehill admin invite";
  const expiresText = params.expiresAt.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject,
      text: [
        "You have been invited to the Stonehill Admin Console.",
        `Role: ${params.role}`,
        `This invite expires ${expiresText}.`,
        "",
        params.inviteLink,
      ].join("\n"),
      html: `
        <p>You have been invited to the Stonehill Admin Console.</p>
        <p><strong>Role:</strong> ${params.role}</p>
        <p>This invite expires ${expiresText}.</p>
        <p><a href="${params.inviteLink}">Accept your invite</a></p>
      `,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { id?: unknown; message?: unknown; error?: unknown }
    | null;

  if (!response.ok) {
    const errorMessage =
      typeof payload?.message === "string"
        ? payload.message
        : typeof payload?.error === "string"
          ? payload.error
          : `Resend responded with ${response.status}.`;

    return { configured: true, sent: false, error: errorMessage };
  }

  return {
    configured: true,
    sent: true,
    messageId: typeof payload?.id === "string" ? payload.id : null,
  };
}

export async function createUserInvite(
  input: CreateUserInviteInput,
): Promise<CreateUserInviteResult> {
  if ((input.role as string) === SUPER_ADMIN) {
    throw new InviteFlowError("FORBIDDEN", "SUPER_ADMIN cannot be assigned by invite.", 403);
  }

  const email = normalizeEmail(input.email);
  const name = cleanName(input.name);
  const duplicateInvite = await findPendingInviteForEmail(email);

  if (duplicateInvite) {
    throw new InviteFlowError(
      "DUPLICATE_PENDING_INVITE",
      "A pending invite already exists for this email address.",
      409,
    );
  }

  await assertEmailIsNotSuperAdmin(email);

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresInDays = safeExpiresInDays(input.expiresInDays);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  const inviteLink = buildInviteLink(input.origin, token);

  const docRef = getAdminFirestore().collection(collections.userInvites).doc();
  const inviteData: UserInvite = {
    email,
    name,
    role: input.role,
    tokenHash,
    status: "pending",
    expiresAt,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    invitedByUid: input.actor.uid,
    invitedByEmail: input.actor.email ?? null,
    acceptedAt: null,
    acceptedByUid: null,
    revokedAt: null,
    revokedByUid: null,
    emailSentAt: null,
    resendMessageId: null,
  };

  try {
    await docRef.set(inviteData);
  } catch (error) {
    console.error("[userInvites] create failed:", error);
    throw new InviteFlowError("INVITE_CREATE_FAILED", "Could not create invite.", 500);
  }

  const resendResult = await sendInviteEmail({
    to: email,
    role: input.role,
    inviteLink,
    expiresAt,
  });

  let invite = toInviteRecord(docRef.id, inviteData);

  if (resendResult.configured && resendResult.sent) {
    const emailPatch = {
      emailSentAt: FieldValue.serverTimestamp(),
      resendMessageId: resendResult.messageId,
      updatedAt: FieldValue.serverTimestamp(),
    };
    await docRef.set(emailPatch, { merge: true });

    invite = {
      ...invite,
      emailSentAt: new Date(),
      resendMessageId: resendResult.messageId,
      updatedAt: new Date(),
    };

    return {
      invite: toPublicInvite(invite),
      delivery: {
        method: "email",
        emailSent: true,
        resendMessageId: resendResult.messageId,
      },
    };
  }

  return {
    invite: toPublicInvite(invite),
    delivery: {
      method: "copy_link",
      emailSent: false,
      inviteLink,
      reason: resendResult.configured ? "resend_failed" : "resend_not_configured",
      ...(resendResult.configured && !resendResult.sent
        ? { emailError: resendResult.error }
        : {}),
    },
  };
}

export async function validateUserInviteToken(token: string): Promise<InvitePublicView> {
  const { invite } = await getValidPendingInviteByToken(token);
  return toPublicInvite(invite);
}

function emailFromDecodedToken(decoded: DecodedIdToken): string {
  if (!decoded.email) {
    throw new InviteFlowError("UNAUTHENTICATED", "The signed-in user has no email address.", 401);
  }

  return normalizeEmail(decoded.email);
}

function displayNameFromInvite(params: {
  requestedName?: string | null;
  decoded: DecodedIdToken;
  invite: UserInvite;
  existingName?: unknown;
  email: string;
}): string {
  const decodedWithName = params.decoded as DecodedIdToken & { name?: unknown };
  const decodedName =
    typeof decodedWithName.name === "string"
      ? decodedWithName.name.trim()
      : "";
  const existingName =
    typeof params.existingName === "string" ? params.existingName.trim() : "";

  return (
    cleanName(params.requestedName) ??
    (existingName ||
      decodedName ||
      params.invite.name ||
      params.email.split("@")[0] ||
      "Admin User")
  );
}

export async function acceptUserInvite(
  input: AcceptUserInviteInput,
): Promise<AcceptUserInviteResult> {
  let decoded: DecodedIdToken;

  try {
    decoded = await getAdminAuth().verifyIdToken(input.idToken, true);
  } catch (error) {
    console.error("[userInvites] accept token verification failed:", error);
    throw new InviteFlowError("UNAUTHENTICATED", "A valid Firebase ID token is required.", 401);
  }

  if (decoded.email_verified !== true) {
    throw new InviteFlowError(
      "EMAIL_UNVERIFIED",
      "Verify your email address before accepting this invite.",
      403,
    );
  }

  const authEmail = emailFromDecodedToken(decoded);
  const db = getAdminFirestore();
  const { ref: inviteRef } = await getValidPendingInviteByToken(input.token);

  let transactionResult: AcceptUserInviteResult | null = null;

  try {
    transactionResult = await db.runTransaction(async (transaction) => {
      const inviteSnapshot = await transaction.get(inviteRef);

      if (!inviteSnapshot.exists) {
        throw new InviteFlowError("INVITE_NOT_FOUND", "Invite not found.", 404);
      }

      const invite = toInviteRecord(inviteSnapshot.id, inviteSnapshot.data() ?? {});

      if (invite.status !== "pending") {
        throw inviteStatusError(invite.status);
      }

      if (isExpired(invite)) {
        transaction.set(
          inviteRef,
          {
            status: "expired",
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        throw new InviteFlowError("INVITE_EXPIRED", "This invite has expired.", 410);
      }

      if (normalizeEmail(invite.email) !== authEmail) {
        throw new InviteFlowError(
          "EMAIL_MISMATCH",
          "This invite is for a different email address.",
          403,
        );
      }

      const userRef = db.collection(collections.users).doc(decoded.uid);
      const userSnapshot = await transaction.get(userRef);
      const existingUser = userSnapshot.exists ? (userSnapshot.data() ?? {}) : {};

      if (existingUser.role === SUPER_ADMIN) {
        throw new InviteFlowError(
          "FORBIDDEN",
          "SUPER_ADMIN accounts cannot be modified through invites.",
          403,
        );
      }

      const displayName = displayNameFromInvite({
        requestedName: input.name,
        decoded,
        invite,
        existingName: existingUser.name,
        email: authEmail,
      });
      const photoUrl =
        typeof existingUser.photoUrl === "string"
          ? existingUser.photoUrl
          : typeof (decoded as { picture?: unknown }).picture === "string"
            ? (decoded as { picture: string }).picture
            : null;

      transaction.set(
        userRef,
        {
          uid: decoded.uid,
          email: authEmail,
          name: displayName,
          role: invite.role,
          approved: true,
          disabled: false,
          photoUrl,
          createdAt: userSnapshot.exists
            ? existingUser.createdAt ?? FieldValue.serverTimestamp()
            : FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          lastLoginAt: existingUser.lastLoginAt ?? null,
          invitedByUid: invite.invitedByUid,
          inviteId: invite.id,
        },
        { merge: true },
      );

      transaction.set(
        inviteRef,
        {
          status: "accepted",
          acceptedAt: FieldValue.serverTimestamp(),
          acceptedByUid: decoded.uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      const acceptedInvite: InviteRecord = {
        ...invite,
        status: "accepted",
        acceptedAt: new Date(),
        acceptedByUid: decoded.uid,
        updatedAt: new Date(),
      };
      const acceptedUser: AcceptUserInviteResult["user"] = {
        uid: decoded.uid,
        email: authEmail,
        name: displayName,
        role: invite.role,
        approved: true,
        disabled: false,
      };

      return {
        invite: toPublicInvite(acceptedInvite),
        user: acceptedUser,
      };
    });
  } catch (error) {
    if (error instanceof InviteFlowError) {
      throw error;
    }

    console.error("[userInvites] accept failed:", error);
    throw new InviteFlowError("INVITE_ACCEPT_FAILED", "Could not accept invite.", 500);
  }

  if (!transactionResult) {
    throw new InviteFlowError("INVITE_ACCEPT_FAILED", "Could not accept invite.", 500);
  }

  try {
    await syncUserClaims(transactionResult.user.uid, {
      role: transactionResult.user.role,
      approved: true,
      disabled: false,
    });
  } catch (error) {
    console.error("[userInvites] claims sync failed:", error);
    throw new InviteFlowError(
      "CLAIMS_SYNC_FAILED",
      "Invite accepted, but custom claims could not be synced.",
      500,
    );
  }

  return transactionResult;
}

// Password-based acceptance for invitees who have no Firebase Auth account
// yet. Server creates the Auth user with emailVerified=true (the invite link
// IS the email verification), then runs the same Firestore + claims sync as
// the ID-token flow.
export async function acceptUserInviteWithPassword(
  input: AcceptInviteWithPasswordInput,
): Promise<AcceptUserInviteResult> {
  if (!input.password || input.password.length < 12) {
    throw new InviteFlowError(
      "INVALID_TOKEN",
      "Password must be at least 12 characters.",
      400,
    );
  }

  const { invite } = await getValidPendingInviteByToken(input.token);
  const email = normalizeEmail(invite.email);
  const displayName =
    cleanName(input.name) ??
    invite.name ??
    email.split("@")[0] ??
    "Admin User";

  let uid: string;
  try {
    const created = await getAdminAuth().createUser({
      email,
      password: input.password,
      displayName,
      emailVerified: true,
    });
    uid = created.uid;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "auth/email-already-exists") {
      throw new InviteFlowError(
        "EMAIL_MISMATCH",
        "An account with this email already exists. Sign in instead, or ask an administrator to revoke the invite.",
        409,
      );
    }
    if (code === "auth/invalid-password" || code === "auth/weak-password") {
      throw new InviteFlowError(
        "INVALID_TOKEN",
        "Password does not meet Firebase Authentication requirements.",
        400,
      );
    }
    console.error("[userInvites] createUser failed:", error);
    throw new InviteFlowError("INVITE_ACCEPT_FAILED", "Could not create the user account.", 500);
  }

  const db = getAdminFirestore();
  // Re-fetch the invite ref inside the transaction so we close the race window
  // between the initial lookup and the user-creation step above.
  const inviteRef = db.collection(collections.userInvites).doc(invite.id);

  let transactionResult: AcceptUserInviteResult | null = null;

  try {
    transactionResult = await db.runTransaction(async (transaction) => {
      const inviteSnapshot = await transaction.get(inviteRef);

      if (!inviteSnapshot.exists) {
        throw new InviteFlowError("INVITE_NOT_FOUND", "Invite not found.", 404);
      }

      const current = toInviteRecord(inviteSnapshot.id, inviteSnapshot.data() ?? {});

      if (current.status !== "pending") {
        throw inviteStatusError(current.status);
      }

      if (isExpired(current)) {
        transaction.set(
          inviteRef,
          { status: "expired", updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
        throw new InviteFlowError("INVITE_EXPIRED", "This invite has expired.", 410);
      }

      const userRef = db.collection(collections.users).doc(uid);

      transaction.set(
        userRef,
        {
          uid,
          email,
          name: displayName,
          role: current.role,
          approved: true,
          disabled: false,
          photoUrl: null,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          lastLoginAt: null,
          invitedByUid: current.invitedByUid,
          inviteId: current.id,
        },
        { merge: true },
      );

      transaction.set(
        inviteRef,
        {
          status: "accepted",
          acceptedAt: FieldValue.serverTimestamp(),
          acceptedByUid: uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      const acceptedInvite: InviteRecord = {
        ...current,
        status: "accepted",
        acceptedAt: new Date(),
        acceptedByUid: uid,
        updatedAt: new Date(),
      };

      return {
        invite: toPublicInvite(acceptedInvite),
        user: {
          uid,
          email,
          name: displayName,
          role: current.role,
          approved: true as const,
          disabled: false as const,
        },
      };
    });
  } catch (error) {
    // Best-effort rollback: if the transaction failed AFTER we created the
    // Auth user, delete the orphaned Auth account so the invitee can retry.
    try {
      await getAdminAuth().deleteUser(uid);
    } catch (cleanupError) {
      console.error("[userInvites] Auth cleanup after failed accept:", cleanupError);
    }

    if (error instanceof InviteFlowError) {
      throw error;
    }
    console.error("[userInvites] accept-with-password failed:", error);
    throw new InviteFlowError("INVITE_ACCEPT_FAILED", "Could not accept invite.", 500);
  }

  if (!transactionResult) {
    throw new InviteFlowError("INVITE_ACCEPT_FAILED", "Could not accept invite.", 500);
  }

  try {
    await syncUserClaims(uid, {
      role: transactionResult.user.role,
      approved: true,
      disabled: false,
    });
  } catch (error) {
    console.error("[userInvites] claims sync failed:", error);
    throw new InviteFlowError(
      "CLAIMS_SYNC_FAILED",
      "Invite accepted, but custom claims could not be synced. Sign in to refresh.",
      500,
    );
  }

  return transactionResult;
}

export async function revokeUserInvite(params: {
  inviteId: string;
  actor: AdminSession;
}): Promise<InvitePublicView> {
  const inviteRef = getAdminFirestore().collection(collections.userInvites).doc(params.inviteId);
  let revokedInvite: InviteRecord | null = null;

  try {
    await getAdminFirestore().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(inviteRef);

      if (!snapshot.exists) {
        throw new InviteFlowError("INVITE_NOT_FOUND", "Invite not found.", 404);
      }

      const invite = toInviteRecord(snapshot.id, snapshot.data() ?? {});

      if (invite.status !== "pending") {
        throw inviteStatusError(invite.status);
      }

      transaction.set(
        inviteRef,
        {
          status: "revoked",
          revokedAt: FieldValue.serverTimestamp(),
          revokedByUid: params.actor.uid,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      revokedInvite = {
        ...invite,
        status: "revoked",
        revokedAt: new Date(),
        revokedByUid: params.actor.uid,
        updatedAt: new Date(),
      };
    });
  } catch (error) {
    if (error instanceof InviteFlowError) {
      throw error;
    }

    console.error("[userInvites] revoke failed:", error);
    throw new InviteFlowError("INVITE_REVOKE_FAILED", "Could not revoke invite.", 500);
  }

  if (!revokedInvite) {
    throw new InviteFlowError("INVITE_REVOKE_FAILED", "Could not revoke invite.", 500);
  }

  return toPublicInvite(revokedInvite);
}
