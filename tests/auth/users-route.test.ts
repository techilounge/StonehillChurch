/**
 * PATCH /api/admin/users/[uid]: changing someone's role or access. Only
 * SUPER_ADMIN may do it, nobody may change their own account, and Firestore
 * and token claims must stay in step.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";

vi.mock("server-only", () => ({}));

// The caller's identity comes from a test header; session verification itself
// is covered in admin-session.test.ts.
vi.mock("@/lib/api/adminSession", () => ({
  requireAdminSessionForRequest: async (request: NextRequest, permission: string) => {
    const raw = request.headers.get("x-test-actor");
    const result = requirePermission(raw ? JSON.parse(raw) : null, permission as never);
    if (result.ok) return result;
    return { ...result, status: result.reason === "UNAUTHENTICATED" ? 401 : 403, message: "denied" };
  },
}));

const users = new Map<string, Record<string, unknown>>();
const claims = new Map<string, Record<string, unknown>>();
let failClaims = false;

vi.mock("@/lib/data/users", () => ({
  getAdminUserById: async (uid: string) => (users.has(uid) ? { uid, ...users.get(uid) } : null),
  updateAdminUser: async (uid: string, update: Record<string, unknown>) => {
    users.set(uid, { ...users.get(uid), ...update });
  },
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  syncUserClaims: async (uid: string, value: Record<string, unknown>) => {
    if (failClaims) throw new Error("claims unavailable");
    claims.set(uid, value);
  },
}));

const { PATCH } = await import("@/app/api/admin/users/[uid]/route");

const ACTORS = {
  SUPER_ADMIN: { uid: "super", role: "SUPER_ADMIN", approved: true },
  ADMIN: { uid: "admin", role: "ADMIN", approved: true },
  EDITOR: { uid: "editor", role: "EDITOR", approved: true },
  VIEWER: { uid: "viewer", role: "VIEWER", approved: true },
};

async function patch(actor: object | null, targetUid: string, body: unknown) {
  const headers = new Headers({ "content-type": "application/json" });
  if (actor) headers.set("x-test-actor", JSON.stringify(actor));
  const request = new NextRequest(`https://church.example/api/admin/users/${targetUid}`, {
    method: "PATCH",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const response = await PATCH(request, { params: Promise.resolve({ uid: targetUid }) });
  return { status: response.status, body: await response.json() };
}

beforeEach(() => {
  users.clear();
  claims.clear();
  failClaims = false;
  users.set("target", { role: "EDITOR", approved: true, disabled: false });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("who can change users", () => {
  it("401 when not signed in", async () => {
    expect((await patch(null, "target", { role: "VIEWER" })).status).toBe(401);
  });

  for (const role of ["ADMIN", "EDITOR", "VIEWER"] as const) {
    it(`${role} cannot change another user's role (403, nothing written)`, async () => {
      const result = await patch(ACTORS[role], "target", { role: "SUPER_ADMIN" });
      expect(result.status).toBe(403);
      expect(users.get("target")?.role).toBe("EDITOR");
      expect(claims.size).toBe(0);
    });
  }

  it("an ADMIN cannot promote themselves either", async () => {
    expect((await patch(ACTORS.ADMIN, "admin", { role: "SUPER_ADMIN" })).status).toBe(403);
  });

  it("an unapproved or disabled SUPER_ADMIN is refused", async () => {
    expect((await patch({ ...ACTORS.SUPER_ADMIN, approved: false }, "target", { role: "VIEWER" })).status).toBe(403);
    expect((await patch({ ...ACTORS.SUPER_ADMIN, disabled: true }, "target", { role: "VIEWER" })).status).toBe(403);
  });

  it("a SUPER_ADMIN cannot change their own account (lock-out guard)", async () => {
    users.set("super", { role: "SUPER_ADMIN", approved: true, disabled: false });
    const result = await patch(ACTORS.SUPER_ADMIN, "super", { disabled: true });
    expect(result).toMatchObject({ status: 403, body: { error: { code: "SELF_MODIFICATION_BLOCKED" } } });
    expect(users.get("super")?.disabled).toBe(false);
  });
});

describe("SUPER_ADMIN updates", () => {
  it("changes the role and syncs token claims from the merged record", async () => {
    const result = await patch(ACTORS.SUPER_ADMIN, "target", { role: "ADMIN" });
    expect(result.status).toBe(200);
    expect(users.get("target")?.role).toBe("ADMIN");
    expect(claims.get("target")).toEqual({ role: "ADMIN", approved: true, disabled: false });
  });

  it("disabling keeps the existing role in the claims", async () => {
    await patch(ACTORS.SUPER_ADMIN, "target", { disabled: true });
    expect(claims.get("target")).toEqual({ role: "EDITOR", approved: true, disabled: true });
  });

  it("rejects unknown roles, wrong types and empty updates", async () => {
    for (const body of [{ role: "OWNER" }, { role: "admin" }, { approved: "true" }, {}]) {
      const result = await patch(ACTORS.SUPER_ADMIN, "target", body);
      expect(result.status).toBe(400);
      expect(result.body.error.code).toBe("VALIDATION_ERROR");
    }
    expect(users.get("target")?.role).toBe("EDITOR");
  });

  it("ignores fields outside role/approved/disabled", async () => {
    await patch(ACTORS.SUPER_ADMIN, "target", { role: "VIEWER", email: "attacker@example.com", uid: "x" });
    expect(users.get("target")).toEqual({ role: "VIEWER", approved: true, disabled: false });
  });

  it("400 on invalid JSON and 404 on an unknown user", async () => {
    expect((await patch(ACTORS.SUPER_ADMIN, "target", "{not json")).status).toBe(400);
    expect((await patch(ACTORS.SUPER_ADMIN, "missing", { role: "VIEWER" })).status).toBe(404);
  });

  it("reports a claims sync failure instead of claiming success", async () => {
    failClaims = true;
    const result = await patch(ACTORS.SUPER_ADMIN, "target", { role: "VIEWER" });
    expect(result).toMatchObject({ status: 500, body: { error: { code: "CLAIMS_SYNC_FAILED" } } });
  });
});
