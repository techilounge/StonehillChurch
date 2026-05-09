import type { FirestoreTimestampLike } from "./shared";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";

export const USER_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];

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
