import type { UserRole } from "@/types/auth";

const ROLE_RANK: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
};

export function hasRole(userRole: UserRole | null | undefined, requiredRole: UserRole): boolean {
  if (!userRole) {
    return false;
  }

  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

export function canViewAdmin(role: UserRole | null | undefined): boolean {
  return hasRole(role, "VIEWER");
}

export function canEditContent(role: UserRole | null | undefined): boolean {
  return hasRole(role, "EDITOR");
}

export function canManageUsers(role: UserRole | null | undefined): boolean {
  return hasRole(role, "ADMIN");
}

export function canManageSystem(role: UserRole | null | undefined): boolean {
  return hasRole(role, "SUPER_ADMIN");
}

