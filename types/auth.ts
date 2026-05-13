import type { FirestoreTimestampLike } from "./shared";

export const SUPER_ADMIN = "SUPER_ADMIN";
export const ADMIN = "ADMIN";
export const EDITOR = "EDITOR";
export const VIEWER = "VIEWER";

export const USER_ROLES = [SUPER_ADMIN, ADMIN, EDITOR, VIEWER] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AppUser = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  approved: boolean;
  disabled: boolean;
  photoUrl: string | null;
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
  lastLoginAt: FirestoreTimestampLike;
};
