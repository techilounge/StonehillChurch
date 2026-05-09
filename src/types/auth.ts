import type { AuditedFields } from "./shared";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "VIEWER";

export type AdminUserProfile = AuditedFields & {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  lastLoginAt: string | null;
};

export type AuthSessionPlaceholder = {
  uid: string;
  email: string;
  role: UserRole;
};

