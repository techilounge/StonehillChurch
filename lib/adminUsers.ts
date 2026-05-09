import {
  type AdminPermission,
  type PermissionSubject,
  hasPermission,
  isApprovedAdmin,
  normalizeRole,
} from "./permissions";

export type AdminUserRecord = PermissionSubject & {
  uid: string;
};

export type AdminUserStore = {
  getUserByUid: (uid: string) => Promise<Record<string, unknown> | null>;
};

export async function getAdminUserFromStore(
  uid: string,
  store: AdminUserStore,
): Promise<AdminUserRecord | null> {
  const record = await store.getUserByUid(uid);

  if (!record) {
    return null;
  }

  return {
    uid,
    email: typeof record.email === "string" ? record.email : null,
    role: normalizeRole(record.role),
    approved: record.approved === true,
    disabled: record.disabled === true,
  };
}

export async function requireAdminUserFromStore(
  uid: string,
  store: AdminUserStore,
): Promise<AdminUserRecord> {
  const user = await getAdminUserFromStore(uid, store);

  if (!isApprovedAdmin(user)) {
    throw new Error("Admin user is not approved or does not have a valid role.");
  }

  return user as AdminUserRecord;
}

export async function requireAdminPermissionFromStore(
  uid: string,
  store: AdminUserStore,
  permission: AdminPermission,
): Promise<AdminUserRecord> {
  const user = await requireAdminUserFromStore(uid, store);

  if (!hasPermission(user, permission)) {
    throw new Error(`Missing required admin permission: ${permission}`);
  }

  return user;
}
