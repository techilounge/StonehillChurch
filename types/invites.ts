import { ADMIN, EDITOR, VIEWER } from "./auth";
import type { UserRole } from "./auth";
import type { FirestoreTimestampLike } from "./shared";

export const INVITABLE_USER_ROLES = [ADMIN, EDITOR, VIEWER] as const;

export type InvitableUserRole = Extract<UserRole, (typeof INVITABLE_USER_ROLES)[number]>;

export const USER_INVITE_STATUSES = [
  "pending",
  "accepted",
  "expired",
  "revoked",
] as const;

export type UserInviteStatus = (typeof USER_INVITE_STATUSES)[number];

export type UserInvite = {
  id?: string;
  email: string;
  name: string | null;
  role: InvitableUserRole;
  tokenHash: string;
  status: UserInviteStatus;
  expiresAt: FirestoreTimestampLike;
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
  invitedByUid: string;
  invitedByEmail: string | null;
  acceptedAt: FirestoreTimestampLike;
  acceptedByUid: string | null;
  revokedAt: FirestoreTimestampLike;
  revokedByUid: string | null;
  emailSentAt: FirestoreTimestampLike;
  resendMessageId: string | null;
};
