import "server-only";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { requirePermission } from "@/lib/auth";
import type { AdminSession } from "@/lib/auth";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/adminRoutes";
import { collections } from "@/lib/constants/collections";
import type { AdminPermission } from "@/lib/permissions";

type DecodedAdminToken = DecodedIdToken & {
  role?: unknown;
  adminRole?: unknown;
  approved?: unknown;
  adminApproved?: unknown;
  disabled?: unknown;
};

export type AdminAuthFailureReason =
  | "UNAUTHENTICATED"
  | "EMAIL_UNVERIFIED"
  | "UNAPPROVED"
  | "FORBIDDEN";

export type AdminRequestAuthResult =
  | { ok: true; session: AdminSession }
  | {
      ok: false;
      reason: AdminAuthFailureReason;
      status: 401 | 403;
      message: string;
    };

const failureMessages: Record<AdminAuthFailureReason, string> = {
  UNAUTHENTICATED: "Could not verify your admin sign-in. Please try again.",
  EMAIL_UNVERIFIED:
    "Your email address has not been verified in Firebase Authentication. Ask an administrator to mark it as verified before signing in.",
  UNAPPROVED: "Your account is not approved for admin access.",
  FORBIDDEN: "You do not have permission to perform this action.",
};

function authFailure(reason: AdminAuthFailureReason): AdminRequestAuthResult {
  return {
    ok: false,
    reason,
    status: reason === "UNAUTHENTICATED" ? 401 : 403,
    message: failureMessages[reason],
  };
}

export function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

function getSessionCookieFromRequest(request: NextRequest): string | null {
  return request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value ?? null;
}

async function getSessionFromDecodedToken(
  decoded: DecodedAdminToken,
  permission: AdminPermission,
): Promise<AdminRequestAuthResult> {
  // Defense in depth: reject Firebase users whose email hasn't been verified.
  // The seed flow sets emailVerified=true; admin-created accounts must be
  // verified in the Firebase Console or via the Admin SDK before sign-in.
  if (decoded.email_verified !== true) {
    return authFailure("EMAIL_UNVERIFIED");
  }

  const profileSnapshot = await getAdminFirestore()
    .collection(collections.users)
    .doc(decoded.uid)
    .get();

  if (!profileSnapshot.exists) {
    return authFailure("UNAPPROVED");
  }

  const profile = profileSnapshot.data() ?? {};
  const tokenRole =
    typeof decoded.role === "string"
      ? decoded.role
      : typeof decoded.adminRole === "string"
        ? decoded.adminRole
        : null;
  const authResult = requirePermission(
    {
      uid: decoded.uid,
      email: typeof profile.email === "string" ? profile.email : decoded.email ?? null,
      role: typeof profile.role === "string" ? profile.role : tokenRole,
      approved:
        typeof profile.approved === "boolean"
          ? profile.approved
          : decoded.approved === true || decoded.adminApproved === true,
      disabled:
        typeof profile.disabled === "boolean" ? profile.disabled : decoded.disabled === true,
    },
    permission,
  );

  if (!authResult.ok) {
    return authFailure(authResult.reason);
  }

  return { ok: true, session: authResult.session };
}

export async function getAdminSessionFromIdToken(
  idToken: string,
  permission: AdminPermission = "admin:access",
): Promise<AdminRequestAuthResult> {
  let decoded: DecodedAdminToken;

  try {
    decoded = (await getAdminAuth().verifyIdToken(idToken)) as DecodedAdminToken;
  } catch (error) {
    console.error("[auth] Failed to verify Firebase ID token.", error);
    return authFailure("UNAUTHENTICATED");
  }

  return getSessionFromDecodedToken(decoded, permission);
}

export async function getAdminSessionFromSessionCookie(
  sessionCookie: string,
  permission: AdminPermission = "admin:access",
): Promise<AdminRequestAuthResult> {
  let decoded: DecodedAdminToken;

  try {
    decoded = (await getAdminAuth().verifySessionCookie(
      sessionCookie,
      true,
    )) as DecodedAdminToken;
  } catch (error) {
    console.error("[auth] Failed to verify admin session cookie.", error);
    return authFailure("UNAUTHENTICATED");
  }

  return getSessionFromDecodedToken(decoded, permission);
}

export async function requireAdminSessionForRequest(
  request: NextRequest,
  permission: AdminPermission = "admin:access",
): Promise<AdminRequestAuthResult> {
  const bearerToken = getBearerToken(request);

  if (bearerToken) {
    return getAdminSessionFromIdToken(bearerToken, permission);
  }

  const sessionCookie = getSessionCookieFromRequest(request);

  if (!sessionCookie) {
    return authFailure("UNAUTHENTICATED");
  }

  return getAdminSessionFromSessionCookie(sessionCookie, permission);
}

export async function getCurrentAdminSession(
  permission: AdminPermission = "admin:access",
): Promise<AdminRequestAuthResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return authFailure("UNAUTHENTICATED");
  }

  return getAdminSessionFromSessionCookie(sessionCookie, permission);
}

export async function getAdminSessionForRequest(
  request: NextRequest,
  permission: AdminPermission,
): Promise<AdminSession | null> {
  const result = await requireAdminSessionForRequest(request, permission);

  return result.ok ? result.session : null;
}
