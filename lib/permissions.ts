export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "EDITOR",
  "VIEWER",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_PERMISSIONS = [
  "admin:access",
  "users:manage",
  "users:delete",
  "settings:manage",
  "settings:critical:manage",
  "youtube:manage",
  "media:read",
  "media:upload",
  "media:manage",
  "content:read",
  "content:create",
  "content:update",
  "content:delete",
  "content:publish",
  "content:submit_for_review",
  "forms:manage",
  "audit_logs:read",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export type PermissionSubject = {
  uid?: string | null;
  email?: string | null;
  role?: AdminRole | string | null;
  approved?: boolean | null;
  disabled?: boolean | null;
};

const ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  SUPER_ADMIN: [
    "admin:access",
    "users:manage",
    "users:delete",
    "settings:manage",
    "settings:critical:manage",
    "youtube:manage",
    "media:read",
    "media:upload",
    "media:manage",
    "content:read",
    "content:create",
    "content:update",
    "content:delete",
    "content:publish",
    "content:submit_for_review",
    "forms:manage",
    "audit_logs:read",
  ],
  ADMIN: [
    "admin:access",
    "settings:manage",
    "media:read",
    "media:upload",
    "media:manage",
    "content:read",
    "content:create",
    "content:update",
    "content:delete",
    "content:publish",
    "content:submit_for_review",
    "forms:manage",
    "audit_logs:read",
  ],
  EDITOR: [
    "admin:access",
    "media:read",
    "media:upload",
    "content:read",
    "content:create",
    "content:update",
    "content:submit_for_review",
  ],
  VIEWER: ["admin:access", "media:read", "content:read"],
};

export const rolePermissions: Readonly<Record<AdminRole, readonly AdminPermission[]>> =
  ROLE_PERMISSIONS;

export function isAdminRole(role: unknown): role is AdminRole {
  return typeof role === "string" && ADMIN_ROLES.includes(role as AdminRole);
}

export function normalizeRole(role: unknown): AdminRole | null {
  return isAdminRole(role) ? role : null;
}

export function hasRole(
  subject: PermissionSubject | null | undefined,
  allowedRoles: readonly AdminRole[],
): boolean {
  const role = normalizeRole(subject?.role);
  return Boolean(role && allowedRoles.includes(role));
}

export function isApprovedAdmin(
  subject: PermissionSubject | null | undefined,
): subject is PermissionSubject & { role: AdminRole } {
  return Boolean(
    subject &&
      normalizeRole(subject.role) &&
      subject.approved === true &&
      subject.disabled !== true,
  );
}

export function hasPermission(
  subject: PermissionSubject | null | undefined,
  permission: AdminPermission,
): boolean {
  if (!isApprovedAdmin(subject)) {
    return false;
  }

  return ROLE_PERMISSIONS[subject.role].includes(permission);
}

export function hasAnyPermission(
  subject: PermissionSubject | null | undefined,
  permissions: readonly AdminPermission[],
): boolean {
  return permissions.some((permission) => hasPermission(subject, permission));
}

export function hasEveryPermission(
  subject: PermissionSubject | null | undefined,
  permissions: readonly AdminPermission[],
): boolean {
  return permissions.every((permission) => hasPermission(subject, permission));
}

export function canAccessAdmin(subject: PermissionSubject | null | undefined): boolean {
  return hasPermission(subject, "admin:access");
}

export function canManageUsers(subject: PermissionSubject | null | undefined): boolean {
  return hasPermission(subject, "users:manage");
}

export function canDeleteUsers(subject: PermissionSubject | null | undefined): boolean {
  return hasPermission(subject, "users:delete");
}

export function canManageSettings(subject: PermissionSubject | null | undefined): boolean {
  return hasPermission(subject, "settings:manage");
}

export function canManageCriticalSettings(
  subject: PermissionSubject | null | undefined,
): boolean {
  return hasPermission(subject, "settings:critical:manage");
}

export function canManageYoutubeSettings(
  subject: PermissionSubject | null | undefined,
): boolean {
  return hasPermission(subject, "youtube:manage");
}

export function canCreateContent(subject: PermissionSubject | null | undefined): boolean {
  return hasPermission(subject, "content:create");
}

export function canEditContent(subject: PermissionSubject | null | undefined): boolean {
  return hasPermission(subject, "content:update");
}

export function canDeleteContent(subject: PermissionSubject | null | undefined): boolean {
  return hasPermission(subject, "content:delete");
}

export function canPublishContent(subject: PermissionSubject | null | undefined): boolean {
  return hasPermission(subject, "content:publish");
}

export function canSubmitContentForReview(
  subject: PermissionSubject | null | undefined,
): boolean {
  return hasPermission(subject, "content:submit_for_review");
}

export function canManageFormSubmissions(
  subject: PermissionSubject | null | undefined,
): boolean {
  return hasPermission(subject, "forms:manage");
}

export function canUploadMedia(subject: PermissionSubject | null | undefined): boolean {
  return hasPermission(subject, "media:upload");
}

export function canManageMedia(subject: PermissionSubject | null | undefined): boolean {
  return hasPermission(subject, "media:manage");
}

export function assertPermission(
  subject: PermissionSubject | null | undefined,
  permission: AdminPermission,
): asserts subject is PermissionSubject & { role: AdminRole } {
  if (!hasPermission(subject, permission)) {
    throw new Error(`Missing required permission: ${permission}`);
  }
}
