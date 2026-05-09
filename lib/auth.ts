import {
  type AdminPermission,
  type AdminRole,
  type PermissionSubject,
  canAccessAdmin,
  hasPermission,
  isApprovedAdmin,
  normalizeRole,
} from "./permissions";

export type FirebaseTokenLike = {
  uid?: string;
  sub?: string;
  email?: string;
  role?: unknown;
  adminRole?: unknown;
  approved?: unknown;
  adminApproved?: unknown;
  disabled?: unknown;
};

export type AdminSession = PermissionSubject & {
  uid: string;
  role: AdminRole;
};

export type AuthGuardResult =
  | { ok: true; session: AdminSession }
  | { ok: false; reason: "UNAUTHENTICATED" | "UNAPPROVED" | "FORBIDDEN" };

export function subjectFromFirebaseToken(
  token: FirebaseTokenLike | null | undefined,
): PermissionSubject | null {
  if (!token) {
    return null;
  }

  return {
    uid: token.uid ?? token.sub ?? null,
    email: token.email ?? null,
    role: normalizeRole(token.role) ?? normalizeRole(token.adminRole),
    approved: token.approved === true || token.adminApproved === true,
    disabled: token.disabled === true,
  };
}

export function requireAdminSession(
  subject: PermissionSubject | null | undefined,
): AuthGuardResult {
  if (!subject?.uid) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  if (!isApprovedAdmin(subject)) {
    return { ok: false, reason: "UNAPPROVED" };
  }

  if (!canAccessAdmin(subject)) {
    return { ok: false, reason: "FORBIDDEN" };
  }

  return {
    ok: true,
    session: {
      uid: subject.uid,
      email: subject.email ?? null,
      role: subject.role,
      approved: true,
      disabled: false,
    },
  };
}

export function requirePermission(
  subject: PermissionSubject | null | undefined,
  permission: AdminPermission,
): AuthGuardResult {
  const session = requireAdminSession(subject);

  if (!session.ok) {
    return session;
  }

  if (!hasPermission(session.session, permission)) {
    return { ok: false, reason: "FORBIDDEN" };
  }

  return session;
}

export function assertAdminSession(
  subject: PermissionSubject | null | undefined,
): AdminSession {
  const result = requireAdminSession(subject);

  if (!result.ok) {
    throw new Error(`Admin access denied: ${result.reason}`);
  }

  return result.session;
}

export function assertAdminPermission(
  subject: PermissionSubject | null | undefined,
  permission: AdminPermission,
): AdminSession {
  const result = requirePermission(subject, permission);

  if (!result.ok) {
    throw new Error(`Admin permission denied: ${result.reason}`);
  }

  return result.session;
}

export type AuditLogInput = {
  actor: AdminSession;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

export function createAuditLogEntry({
  actor,
  action,
  targetType,
  targetId = null,
  metadata = {},
}: AuditLogInput): Record<string, unknown> {
  return {
    actorUid: actor.uid,
    actorEmail: actor.email ?? null,
    actorRole: actor.role,
    action,
    targetType,
    targetId,
    metadata,
    createdAt: new Date().toISOString(),
  };
}
