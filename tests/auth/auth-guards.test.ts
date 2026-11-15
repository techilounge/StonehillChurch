/**
 * Session guards in lib/auth.ts and the redirect helpers in lib/adminRoutes.ts.
 */
import { describe, expect, it } from "vitest";
import {
  assertAdminPermission,
  assertAdminSession,
  createAuditLogEntry,
  requireAdminSession,
  requirePermission,
  subjectFromFirebaseToken,
} from "@/lib/auth";
import {
  ADMIN_DEFAULT_PATH,
  adminLoginRedirectPath,
  isAdminInvitePath,
  isAdminLoginPath,
  isAdminPublicPath,
  safeAdminReturnTo,
} from "@/lib/adminRoutes";

const approvedEditor = { uid: "u1", email: "e@example.com", role: "EDITOR", approved: true, disabled: false };

describe("subjectFromFirebaseToken", () => {
  it("returns null for a missing token", () => {
    expect(subjectFromFirebaseToken(null)).toBeNull();
    expect(subjectFromFirebaseToken(undefined)).toBeNull();
  });

  it("reads the standard claims", () => {
    expect(
      subjectFromFirebaseToken({ uid: "u1", email: "a@b.co", role: "ADMIN", approved: true }),
    ).toEqual({ uid: "u1", email: "a@b.co", role: "ADMIN", approved: true, disabled: false });
  });

  it("falls back to sub, adminRole and adminApproved", () => {
    expect(subjectFromFirebaseToken({ sub: "s1", adminRole: "VIEWER", adminApproved: true })).toEqual({
      uid: "s1",
      email: null,
      role: "VIEWER",
      approved: true,
      disabled: false,
    });
  });

  it("ignores an invalid role claim in favor of a valid adminRole", () => {
    expect(subjectFromFirebaseToken({ uid: "u1", role: "OWNER", adminRole: "EDITOR" })?.role).toBe("EDITOR");
  });

  it("only accepts boolean true for approved and disabled", () => {
    const s = subjectFromFirebaseToken({ uid: "u1", role: "ADMIN", approved: "true", disabled: "true" });
    expect(s?.approved).toBe(false);
    expect(s?.disabled).toBe(false);
    expect(subjectFromFirebaseToken({ uid: "u1", role: "ADMIN", approved: true, disabled: true })?.disabled).toBe(true);
  });
});

describe("requireAdminSession", () => {
  it("UNAUTHENTICATED without a uid", () => {
    expect(requireAdminSession(null)).toEqual({ ok: false, reason: "UNAUTHENTICATED" });
    expect(requireAdminSession({ ...approvedEditor, uid: "" })).toEqual({ ok: false, reason: "UNAUTHENTICATED" });
  });

  it("UNAPPROVED for unapproved, disabled or role-less users", () => {
    for (const s of [
      { ...approvedEditor, approved: false },
      { ...approvedEditor, disabled: true },
      { ...approvedEditor, role: null },
      { ...approvedEditor, role: "OWNER" },
    ]) {
      expect(requireAdminSession(s)).toEqual({ ok: false, reason: "UNAPPROVED" });
    }
  });

  it("returns a clean session that drops extra fields", () => {
    const result = requireAdminSession({ ...approvedEditor, extra: "x" } as typeof approvedEditor);
    expect(result).toEqual({
      ok: true,
      session: { uid: "u1", email: "e@example.com", role: "EDITOR", approved: true, disabled: false },
    });
  });
});

describe("requirePermission", () => {
  it("passes through session failures before checking the permission", () => {
    expect(requirePermission(null, "content:read")).toEqual({ ok: false, reason: "UNAUTHENTICATED" });
    expect(requirePermission({ ...approvedEditor, approved: false }, "content:read")).toEqual({
      ok: false,
      reason: "UNAPPROVED",
    });
  });

  it("FORBIDDEN when the role lacks the permission", () => {
    expect(requirePermission(approvedEditor, "content:publish")).toEqual({ ok: false, reason: "FORBIDDEN" });
    expect(requirePermission(approvedEditor, "content:update").ok).toBe(true);
  });

  it("assert helpers throw with the reason", () => {
    expect(() => assertAdminSession(null)).toThrow("Admin access denied: UNAUTHENTICATED");
    expect(() => assertAdminPermission(approvedEditor, "users:manage")).toThrow(
      "Admin permission denied: FORBIDDEN",
    );
    expect(assertAdminPermission(approvedEditor, "content:read").uid).toBe("u1");
  });
});

describe("createAuditLogEntry", () => {
  it("records the actor and target", () => {
    const entry = createAuditLogEntry({
      actor: { uid: "u1", email: null, role: "ADMIN", approved: true, disabled: false },
      action: "content.publish",
      targetType: "events",
      targetId: "e1",
    });
    expect(entry).toMatchObject({
      actorUid: "u1",
      actorEmail: null,
      actorRole: "ADMIN",
      action: "content.publish",
      targetType: "events",
      targetId: "e1",
      metadata: {},
    });
    expect(Number.isNaN(Date.parse(entry.createdAt as string))).toBe(false);
  });
});

describe("admin route helpers", () => {
  it("identifies public admin paths without prefix tricks", () => {
    expect(isAdminLoginPath("/admin/login")).toBe(true);
    expect(isAdminLoginPath("/admin/login/reset")).toBe(true);
    expect(isAdminLoginPath("/admin/loginx")).toBe(false);
    expect(isAdminInvitePath("/admin/invite/abc")).toBe(true);
    expect(isAdminInvitePath("/admin/invites")).toBe(false);
    expect(isAdminPublicPath("/admin/dashboard")).toBe(false);
    expect(isAdminPublicPath("/admin")).toBe(false);
  });

  describe("safeAdminReturnTo blocks open redirects", () => {
    const rejected: unknown[] = [
      undefined,
      null,
      42,
      "",
      "   ",
      "https://evil.example/admin",
      "//evil.example/admin",
      "/admin://evil.example",
      "/administrator",
      "/adminx/dashboard",
      "/",
      "/events",
      "/admin/login",
      "/admin/login?returnTo=/admin/users",
      "javascript:alert(1)",
    ];
    for (const value of rejected) {
      it(`rejects ${JSON.stringify(value)}`, () => {
        expect(safeAdminReturnTo(value)).toBe(ADMIN_DEFAULT_PATH);
      });
    }

    it("keeps legitimate admin paths, including the query string", () => {
      expect(safeAdminReturnTo("/admin")).toBe("/admin");
      expect(safeAdminReturnTo("/admin/events/abc?tab=details")).toBe("/admin/events/abc?tab=details");
      expect(safeAdminReturnTo("  /admin/users  ")).toBe("/admin/users");
    });

    it("resolved URLs stay on the same origin", () => {
      // Whatever survives the filter must not leave the site when a browser
      // resolves it, including backslash and encoded tricks.
      const origin = "https://church.example";
      for (const value of ["/admin/\\evil.example", "/admin/%2F%2Fevil.example", "/admin/../../evil", "/admin/\t//evil"]) {
        expect(new URL(safeAdminReturnTo(value), origin).origin).toBe(origin);
      }
    });
  });

  it("adminLoginRedirectPath sanitizes returnTo and lower-cases the reason", () => {
    expect(adminLoginRedirectPath("https://evil.example", "UNAPPROVED")).toBe(
      "/admin/login?returnTo=%2Fadmin%2Fdashboard&reason=unapproved",
    );
    expect(adminLoginRedirectPath("/admin/events")).toBe("/admin/login?returnTo=%2Fadmin%2Fevents");
  });
});
