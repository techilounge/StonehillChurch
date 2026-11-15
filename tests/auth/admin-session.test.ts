/**
 * Server-side session verification in lib/api/adminSession.ts.
 *
 * Firebase Admin is replaced by an in-memory fake: tokens are looked up in a
 * table instead of being cryptographically verified, and the users collection
 * is a Map. What is under test is the decision logic layered on top.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

const tokens = new Map<string, Record<string, unknown>>();
const sessionCookies = new Map<string, Record<string, unknown>>();
const users = new Map<string, Record<string, unknown>>();
const verifySessionCookieCalls: Array<[string, boolean]> = [];
let cookieJar: Record<string, string> = {};

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminAuth: () => ({
    verifyIdToken: async (token: string) => {
      const decoded = tokens.get(token);
      if (!decoded) throw new Error("invalid token");
      return decoded;
    },
    verifySessionCookie: async (cookie: string, checkRevoked: boolean) => {
      verifySessionCookieCalls.push([cookie, checkRevoked]);
      const decoded = sessionCookies.get(cookie);
      if (!decoded) throw new Error("invalid or revoked cookie");
      return decoded;
    },
  }),
  getAdminFirestore: () => ({
    collection: () => ({
      doc: (uid: string) => ({
        get: async () => ({ exists: users.has(uid), data: () => users.get(uid) }),
      }),
    }),
  }),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (name in cookieJar ? { name, value: cookieJar[name] } : undefined),
  }),
}));

const {
  getAdminSessionForRequest,
  getAdminSessionFromIdToken,
  getBearerToken,
  getCurrentAdminSession,
  requireAdminSessionForRequest,
} = await import("@/lib/api/adminSession");
const { ADMIN_SESSION_COOKIE_NAME } = await import("@/lib/adminRoutes");

function request(headers: Record<string, string> = {}, cookie?: string): NextRequest {
  const h = new Headers(headers);
  if (cookie) h.set("cookie", `${ADMIN_SESSION_COOKIE_NAME}=${cookie}`);
  return new NextRequest("https://church.example/api/admin/cms/events", { headers: h });
}

function decoded(uid: string, extra: Record<string, unknown> = {}) {
  return { uid, email: `${uid}@example.com`, email_verified: true, ...extra };
}

beforeEach(() => {
  tokens.clear();
  sessionCookies.clear();
  users.clear();
  verifySessionCookieCalls.length = 0;
  cookieJar = {};
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getBearerToken", () => {
  it("extracts only a well-formed bearer token", () => {
    expect(getBearerToken(request({ authorization: "Bearer abc" }))).toBe("abc");
    expect(getBearerToken(request({ authorization: "bearer abc" }))).toBeNull();
    expect(getBearerToken(request({ authorization: "Basic abc" }))).toBeNull();
    expect(getBearerToken(request({ authorization: "Bearer    " }))).toBeNull();
    expect(getBearerToken(request())).toBeNull();
  });
});

describe("token verification outcomes", () => {
  it("401 UNAUTHENTICATED for an invalid token", async () => {
    const result = await getAdminSessionFromIdToken("forged");
    expect(result).toMatchObject({ ok: false, reason: "UNAUTHENTICATED", status: 401 });
  });

  it("403 EMAIL_UNVERIFIED when the email is not verified", async () => {
    tokens.set("t", decoded("u1", { email_verified: false }));
    users.set("u1", { role: "SUPER_ADMIN", approved: true });
    expect(await getAdminSessionFromIdToken("t")).toMatchObject({
      ok: false,
      reason: "EMAIL_UNVERIFIED",
      status: 403,
    });
  });

  it("403 UNAPPROVED when there is no user profile, even with admin claims", async () => {
    tokens.set("t", decoded("u1", { role: "SUPER_ADMIN", approved: true }));
    expect(await getAdminSessionFromIdToken("t")).toMatchObject({ ok: false, reason: "UNAPPROVED", status: 403 });
  });

  it("succeeds for an approved profile and returns the profile's role", async () => {
    tokens.set("t", decoded("u1"));
    users.set("u1", { email: "profile@example.com", role: "EDITOR", approved: true, disabled: false });
    expect(await getAdminSessionFromIdToken("t", "content:update")).toEqual({
      ok: true,
      session: { uid: "u1", email: "profile@example.com", role: "EDITOR", approved: true, disabled: false },
    });
  });

  it("403 FORBIDDEN when the role lacks the requested permission", async () => {
    tokens.set("t", decoded("u1"));
    users.set("u1", { role: "EDITOR", approved: true });
    expect(await getAdminSessionFromIdToken("t", "content:publish")).toMatchObject({
      ok: false,
      reason: "FORBIDDEN",
      status: 403,
    });
  });
});

describe("the Firestore profile overrides stale token claims", () => {
  // Claims are only refreshed when the user's token is re-issued, so a
  // demotion or suspension must take effect from the profile immediately.
  it("a demoted user loses access even if the token still says SUPER_ADMIN", async () => {
    tokens.set("t", decoded("u1", { role: "SUPER_ADMIN", approved: true }));
    users.set("u1", { role: "VIEWER", approved: true });
    expect(await getAdminSessionFromIdToken("t", "users:manage")).toMatchObject({ reason: "FORBIDDEN" });
  });

  it("a disabled profile blocks access even if the token says enabled", async () => {
    tokens.set("t", decoded("u1", { role: "ADMIN", approved: true, disabled: false }));
    users.set("u1", { role: "ADMIN", approved: true, disabled: true });
    expect(await getAdminSessionFromIdToken("t")).toMatchObject({ reason: "UNAPPROVED" });
  });

  it("an unapproved profile blocks access even if the token says approved", async () => {
    tokens.set("t", decoded("u1", { role: "ADMIN", approved: true }));
    users.set("u1", { role: "ADMIN", approved: false });
    expect(await getAdminSessionFromIdToken("t")).toMatchObject({ reason: "UNAPPROVED" });
  });

  it("an invalid profile role is not rescued by a valid token role", async () => {
    tokens.set("t", decoded("u1", { role: "SUPER_ADMIN" }));
    users.set("u1", { role: "OWNER", approved: true });
    expect(await getAdminSessionFromIdToken("t")).toMatchObject({ reason: "UNAPPROVED" });
  });

  it("falls back to token claims only for fields the profile does not set", async () => {
    tokens.set("t", decoded("u1", { adminRole: "EDITOR", adminApproved: true }));
    users.set("u1", {});
    expect(await getAdminSessionFromIdToken("t")).toMatchObject({ ok: true, session: { role: "EDITOR" } });
  });
});

describe("requireAdminSessionForRequest", () => {
  beforeEach(() => {
    users.set("bearer-user", { role: "VIEWER", approved: true });
    users.set("cookie-user", { role: "ADMIN", approved: true });
    tokens.set("good-token", decoded("bearer-user"));
    sessionCookies.set("good-cookie", decoded("cookie-user"));
  });

  it("401 with neither a bearer token nor a cookie", async () => {
    expect(await requireAdminSessionForRequest(request())).toMatchObject({ ok: false, status: 401 });
  });

  it("uses the session cookie and always checks revocation", async () => {
    const result = await requireAdminSessionForRequest(request({}, "good-cookie"));
    expect(result).toMatchObject({ ok: true, session: { uid: "cookie-user" } });
    expect(verifySessionCookieCalls).toEqual([["good-cookie", true]]);
  });

  it("a bearer token takes precedence over the cookie", async () => {
    const result = await requireAdminSessionForRequest(
      request({ authorization: "Bearer good-token" }, "good-cookie"),
    );
    expect(result).toMatchObject({ ok: true, session: { uid: "bearer-user" } });
  });

  it("an invalid bearer token does not fall back to a valid cookie", async () => {
    const result = await requireAdminSessionForRequest(
      request({ authorization: "Bearer forged" }, "good-cookie"),
    );
    expect(result).toMatchObject({ ok: false, reason: "UNAUTHENTICATED" });
    expect(verifySessionCookieCalls).toHaveLength(0);
  });

  it("a revoked or forged cookie is rejected", async () => {
    expect(await requireAdminSessionForRequest(request({}, "revoked"))).toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("getAdminSessionForRequest returns null instead of a failure", async () => {
    expect(await getAdminSessionForRequest(request({}, "good-cookie"), "content:publish")).toMatchObject({
      uid: "cookie-user",
    });
    expect(await getAdminSessionForRequest(request({}, "good-cookie"), "users:manage")).toBeNull();
  });
});

describe("getCurrentAdminSession (server components)", () => {
  it("401 without the cookie", async () => {
    expect(await getCurrentAdminSession()).toMatchObject({ ok: false, status: 401 });
  });

  it("verifies the cookie from next/headers", async () => {
    users.set("u1", { role: "SUPER_ADMIN", approved: true });
    sessionCookies.set("c1", decoded("u1"));
    cookieJar = { [ADMIN_SESSION_COOKIE_NAME]: "c1" };
    expect(await getCurrentAdminSession("users:manage")).toMatchObject({ ok: true, session: { uid: "u1" } });
    expect(verifySessionCookieCalls).toEqual([["c1", true]]);
  });
});
