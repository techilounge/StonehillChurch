/**
 * Authorization rules in lib/permissions.ts and lib/adminUsers.ts.
 *
 * The role x permission matrix below is written out by hand on purpose: a
 * change to ROLE_PERMISSIONS must be made in two places, so granting a role a
 * new power is always a deliberate, reviewed decision.
 */
import { describe, expect, it } from "vitest";
import {
  ADMIN_PERMISSIONS,
  type AdminPermission,
  type AdminRole,
  assertPermission,
  canAccessAdmin,
  canDeleteContent,
  canDeleteUsers,
  canManageCriticalSettings,
  canManageMedia,
  canManageSettings,
  canManageUsers,
  canPublishContent,
  canUploadMedia,
  hasAnyPermission,
  hasEveryPermission,
  hasPermission,
  hasRole,
  isAdminRole,
  isApprovedAdmin,
  normalizeRole,
  type PermissionSubject,
} from "@/lib/permissions";
import {
  getAdminUserFromStore,
  requireAdminPermissionFromStore,
  requireAdminUserFromStore,
  type AdminUserStore,
} from "@/lib/adminUsers";

const EXPECTED: Record<AdminRole, readonly AdminPermission[]> = {
  SUPER_ADMIN: ADMIN_PERMISSIONS,
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

const ROLES = Object.keys(EXPECTED) as AdminRole[];

function subject(role: unknown, overrides: Partial<PermissionSubject> = {}): PermissionSubject {
  return { uid: "u1", email: "u1@example.com", role: role as string, approved: true, disabled: false, ...overrides };
}

describe("role x permission matrix", () => {
  for (const role of ROLES) {
    for (const permission of ADMIN_PERMISSIONS) {
      const allowed = EXPECTED[role].includes(permission);
      it(`${role} ${allowed ? "has" : "lacks"} ${permission}`, () => {
        expect(hasPermission(subject(role), permission)).toBe(allowed);
      });
    }
  }

  it("only SUPER_ADMIN can manage or delete users and critical settings", () => {
    for (const role of ROLES) {
      const s = subject(role);
      const isSuper = role === "SUPER_ADMIN";
      expect(canManageUsers(s)).toBe(isSuper);
      expect(canDeleteUsers(s)).toBe(isSuper);
      expect(canManageCriticalSettings(s)).toBe(isSuper);
    }
  });

  it("editors can upload media but cannot publish, delete or manage media", () => {
    const editor = subject("EDITOR");
    expect(canUploadMedia(editor)).toBe(true);
    expect(canPublishContent(editor)).toBe(false);
    expect(canDeleteContent(editor)).toBe(false);
    expect(canManageMedia(editor)).toBe(false);
    expect(canManageSettings(editor)).toBe(false);
  });
});

describe("subjects that must get no permissions at all", () => {
  const denied: Array<[string, PermissionSubject | null | undefined]> = [
    ["null", null],
    ["undefined", undefined],
    ["unapproved SUPER_ADMIN", subject("SUPER_ADMIN", { approved: false })],
    ["approved missing (null)", subject("SUPER_ADMIN", { approved: null })],
    ["disabled SUPER_ADMIN", subject("SUPER_ADMIN", { disabled: true })],
    ["no role", subject(null)],
    ["lowercase role", subject("super_admin")],
    ["padded role", subject(" ADMIN ")],
    ["unknown role", subject("OWNER")],
    ["prototype key as role", subject("constructor")],
    ["array role", subject(["SUPER_ADMIN"])],
  ];

  for (const [label, s] of denied) {
    it(label, () => {
      expect(canAccessAdmin(s)).toBe(false);
      for (const permission of ADMIN_PERMISSIONS) {
        expect(hasPermission(s, permission)).toBe(false);
      }
      expect(hasAnyPermission(s, ADMIN_PERMISSIONS)).toBe(false);
    });
  }

  it("approved must be the boolean true, not a truthy value", () => {
    expect(isApprovedAdmin(subject("ADMIN", { approved: "true" as unknown as boolean }))).toBe(false);
    expect(isApprovedAdmin(subject("ADMIN", { approved: 1 as unknown as boolean }))).toBe(false);
  });
});

describe("role helpers", () => {
  it("recognizes exactly the four roles", () => {
    expect(ROLES.every(isAdminRole)).toBe(true);
    expect(isAdminRole("admin")).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
    expect(normalizeRole("toString")).toBeNull();
    expect(normalizeRole("EDITOR")).toBe("EDITOR");
  });

  it("hasRole checks the role only, not approval", () => {
    expect(hasRole(subject("EDITOR"), ["EDITOR", "ADMIN"])).toBe(true);
    expect(hasRole(subject("VIEWER"), ["EDITOR", "ADMIN"])).toBe(false);
    expect(hasRole(null, ["EDITOR"])).toBe(false);
  });
});

describe("combinators and assertions", () => {
  it("hasAnyPermission / hasEveryPermission", () => {
    const editor = subject("EDITOR");
    expect(hasAnyPermission(editor, ["content:publish", "content:update"])).toBe(true);
    expect(hasEveryPermission(editor, ["content:publish", "content:update"])).toBe(false);
    expect(hasEveryPermission(subject("ADMIN"), ["content:publish", "content:update"])).toBe(true);
    // Vacuous truth: callers must never pass an empty list as a guard.
    expect(hasEveryPermission(null, [])).toBe(true);
    expect(hasAnyPermission(subject("SUPER_ADMIN"), [])).toBe(false);
  });

  it("assertPermission throws with the missing permission name", () => {
    expect(() => assertPermission(subject("VIEWER"), "content:update")).toThrow(
      "Missing required permission: content:update",
    );
    expect(() => assertPermission(subject("EDITOR"), "content:update")).not.toThrow();
  });
});

describe("store-backed admin user checks", () => {
  function storeWith(record: Record<string, unknown> | null): AdminUserStore {
    return { getUserByUid: async () => record };
  }

  it("normalizes the stored record strictly", async () => {
    const user = await getAdminUserFromStore(
      "u1",
      storeWith({ email: 42, role: "editor", approved: "yes", disabled: "no" }),
    );
    expect(user).toEqual({ uid: "u1", email: null, role: null, approved: false, disabled: false });
    expect(await getAdminUserFromStore("u1", storeWith(null))).toBeNull();
  });

  it("rejects missing, unapproved and disabled users", async () => {
    await expect(requireAdminUserFromStore("u1", storeWith(null))).rejects.toThrow(/not approved/);
    await expect(
      requireAdminUserFromStore("u1", storeWith({ role: "ADMIN", approved: false })),
    ).rejects.toThrow(/not approved/);
    await expect(
      requireAdminUserFromStore("u1", storeWith({ role: "ADMIN", approved: true, disabled: true })),
    ).rejects.toThrow(/not approved/);
  });

  it("enforces the requested permission", async () => {
    const editor = storeWith({ role: "EDITOR", approved: true });
    await expect(requireAdminPermissionFromStore("u1", editor, "content:update")).resolves.toMatchObject({
      uid: "u1",
      role: "EDITOR",
    });
    await expect(requireAdminPermissionFromStore("u1", editor, "users:manage")).rejects.toThrow(
      "Missing required admin permission: users:manage",
    );
  });
});
