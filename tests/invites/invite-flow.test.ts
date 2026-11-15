/**
 * Admin invite flow: create (SUPER_ADMIN only) -> lookup (anonymous, by token)
 * -> accept with password (anonymous, by token) and revoke. Runs the real
 * routes and lib/data/userInvites.ts against in-memory Firebase fakes.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { fakeAuth, fakeClaims, fakeDb, resetFakes } from "../helpers/fakeFirebase";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/firebaseAdmin", async () => (await import("../helpers/fakeFirebase")).firebaseAdminMock());

let rateLimitAllowed = true;
vi.mock("@/lib/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rateLimit")>()),
  consumeRateLimit: async () => ({ allowed: rateLimitAllowed, limit: 10, remaining: 0, resetAt: Date.now() + 60_000 }),
}));

// Caller identity from a test header; real verification is in tests/auth.
vi.mock("@/lib/api/adminSession", () => ({
  requireAdminSessionForRequest: async (request: NextRequest, permission: string) => {
    const raw = request.headers.get("x-test-actor");
    const result = requirePermission(raw ? JSON.parse(raw) : null, permission as never);
    return result.ok ? result : { ...result, status: result.reason === "UNAUTHENTICATED" ? 401 : 403, message: "denied" };
  },
}));

const invitesRoute = await import("@/app/api/admin/users/invites/route");
const revokeRoute = await import("@/app/api/admin/users/invites/[id]/route");
const lookupRoute = await import("@/app/api/admin/users/invites/lookup/route");
const acceptRoute = await import("@/app/api/admin/users/invites/accept/route");

const SUPER = { uid: "super", email: "owner@example.com", role: "SUPER_ADMIN", approved: true };
const ADMIN = { uid: "admin", email: "admin@example.com", role: "ADMIN", approved: true };
const PASSWORD = "correct horse 42 battery";

function req(url: string, init: { method?: string; actor?: object | null; body?: unknown } = {}) {
  const headers = new Headers({ "content-type": "application/json" });
  if (init.actor) headers.set("x-test-actor", JSON.stringify(init.actor));
  return new NextRequest(`https://church.example${url}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : typeof init.body === "string" ? init.body : JSON.stringify(init.body),
  });
}

async function json(response: Response) {
  return { status: response.status, body: await response.json() };
}

async function createInvite(body: Record<string, unknown> = {}, actor: object | null = SUPER) {
  return json(
    await invitesRoute.POST(req("/api/admin/users/invites", { method: "POST", actor, body: { email: "New.Person@Example.com", role: "EDITOR", ...body } })),
  );
}

/** Creates an invite and returns its raw token from the copy-link delivery. */
async function inviteToken(body: Record<string, unknown> = {}): Promise<{ token: string; id: string }> {
  const { body: res } = await createInvite(body);
  const link = new URL(res.data.delivery.inviteLink);
  return { token: link.searchParams.get("token")!, id: res.data.invite.id };
}

const lookup = async (token: string) =>
  json(await lookupRoute.GET(req(`/api/admin/users/invites/lookup?token=${encodeURIComponent(token)}`)));
const accept = async (body: Record<string, unknown>) =>
  json(await acceptRoute.POST(req("/api/admin/users/invites/accept", { method: "POST", body })));

beforeEach(() => {
  resetFakes();
  rateLimitAllowed = true;
  vi.unstubAllEnvs();
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://church.example");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("creating invites", () => {
  it("only SUPER_ADMIN can create, list or revoke invites", async () => {
    for (const actor of [undefined, ADMIN, { ...SUPER, approved: false }]) {
      const created = await createInvite({}, actor ?? null);
      expect(created.status).toBeGreaterThanOrEqual(401);
      expect(created.status).toBeLessThanOrEqual(403);
      expect((await invitesRoute.GET(req("/api/admin/users/invites", { actor }))).status).toBeGreaterThanOrEqual(401);
      const revoked = await revokeRoute.DELETE(req("/api/admin/users/invites/x", { method: "DELETE", actor }), {
        params: Promise.resolve({ id: "x" }),
      });
      expect(revoked.status).toBeGreaterThanOrEqual(401);
    }
    expect(fakeDb.col("userInvites").size).toBe(0);
  });

  it("cannot invite someone as SUPER_ADMIN", async () => {
    const result = await createInvite({ role: "SUPER_ADMIN" });
    expect(result.status).toBe(400);
    expect(fakeDb.col("userInvites").size).toBe(0);
  });

  it("cannot send an invite to an existing SUPER_ADMIN's email", async () => {
    fakeDb.seed("users", "owner", { email: "new.person@example.com", role: "SUPER_ADMIN" });
    expect(await createInvite()).toMatchObject({ status: 403, body: { error: { code: "FORBIDDEN" } } });
  });

  it("stores only a hash of the token, and the email lower-cased", async () => {
    const { token, id } = await inviteToken();
    const stored = fakeDb.get("userInvites", id)!;
    expect(token.length).toBeGreaterThanOrEqual(43); // 32 random bytes, base64url
    expect(stored.tokenHash).toBe(createHash("sha256").update(token).digest("hex"));
    expect(JSON.stringify(stored)).not.toContain(token);
    expect(stored).toMatchObject({ email: "new.person@example.com", role: "EDITOR", status: "pending", invitedByUid: "super" });
  });

  it("tokens are unique per invite", async () => {
    const a = await inviteToken({ email: "a@example.com" });
    const b = await inviteToken({ email: "b@example.com" });
    expect(a.token).not.toBe(b.token);
  });

  it("the invite link uses the configured site URL, not the request's Origin", async () => {
    const response = await invitesRoute.POST(
      new NextRequest("https://church.example/api/admin/users/invites", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://evil.example", "x-test-actor": JSON.stringify(SUPER) },
        body: JSON.stringify({ email: "x@example.com", role: "VIEWER" }),
      }),
    );
    const { data } = await response.json();
    expect(data.delivery.inviteLink).toMatch(/^https:\/\/church\.example\/admin\/invite\?token=/);
  });

  it("the API response and the invite list never include the token hash", async () => {
    const { body } = await createInvite();
    expect(body.data.invite).not.toHaveProperty("tokenHash");
    const list = await json(await invitesRoute.GET(req("/api/admin/users/invites", { actor: SUPER })));
    expect(list.body.data.invites).toHaveLength(1);
    expect(list.body.data.invites[0]).not.toHaveProperty("tokenHash");
  });

  it("refuses a second pending invite for the same email (any case)", async () => {
    await createInvite();
    expect(await createInvite({ email: "NEW.PERSON@example.com" })).toMatchObject({
      status: 409,
      body: { error: { code: "DUPLICATE_PENDING_INVITE" } },
    });
  });

  it("an expired pending invite does not block a new one", async () => {
    const { id } = await inviteToken();
    fakeDb.get("userInvites", id)!.expiresAt = new Date(Date.now() - 1000);
    expect((await createInvite()).status).toBe(201);
  });

  it("expiry defaults to 7 days and is limited to 1-30", async () => {
    const days = async (expiresInDays?: number, email = `${expiresInDays}@example.com`) => {
      const { body } = await createInvite({ email, ...(expiresInDays ? { expiresInDays } : {}) });
      return body.data ? Math.round((Date.parse(body.data.invite.expiresAt) - Date.now()) / 86_400_000) : body.error.code;
    };
    expect(await days(undefined, "default@example.com")).toBe(7);
    expect(await days(30)).toBe(30);
    expect(await days(31)).toBe("VALIDATION_ERROR");
    expect(await days(0, "zero@example.com")).toBe(7); // 0 is treated as "not provided"
  });

  describe("email delivery", () => {
    it("falls back to a copy-link when Resend is not configured", async () => {
      const { body } = await createInvite();
      expect(body.data.delivery).toMatchObject({ method: "copy_link", emailSent: false, reason: "resend_not_configured" });
    });

    it("sends the email and does not return the link when Resend succeeds", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test");
      const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "msg_1" }), { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);
      const { body } = await createInvite();
      vi.unstubAllGlobals();
      expect(body.data.delivery).toEqual({ method: "email", emailSent: true, resendMessageId: "msg_1" });
      expect(JSON.stringify(body)).not.toContain("token=");
      const sent = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
      expect(sent.to).toBe("new.person@example.com");
      expect(sent.text).toMatch(/https:\/\/church\.example\/admin\/invite\?token=/);
      expect(fakeDb.get("userInvites", body.data.invite.id)).toMatchObject({ resendMessageId: "msg_1" });
    });

    it("returns the copy-link with the reason when Resend fails", async () => {
      vi.stubEnv("RESEND_API_KEY", "re_test");
      vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ message: "domain not verified" }), { status: 403 }));
      const { status, body } = await createInvite();
      vi.unstubAllGlobals();
      expect(status).toBe(201);
      expect(body.data.delivery).toMatchObject({ method: "copy_link", reason: "resend_failed", emailError: "domain not verified" });
    });
  });
});

describe("looking up an invite by token (anonymous)", () => {
  it("returns only email, role and expiry", async () => {
    const { token } = await inviteToken();
    const { status, body } = await lookup(token);
    expect(status).toBe(200);
    expect(Object.keys(body.data).sort()).toEqual(["email", "expiresAt", "role"]);
    expect(body.data).toMatchObject({ email: "new.person@example.com", role: "EDITOR" });
  });

  it("every failure looks identical, so tokens cannot be probed", async () => {
    const accepted = await inviteToken({ email: "a@example.com" });
    const revoked = await inviteToken({ email: "r@example.com" });
    const expired = await inviteToken({ email: "e@example.com" });
    fakeDb.get("userInvites", accepted.id)!.status = "accepted";
    fakeDb.get("userInvites", revoked.id)!.status = "revoked";
    fakeDb.get("userInvites", expired.id)!.expiresAt = new Date(Date.now() - 1);

    const results = await Promise.all(
      ["", "   ", "not-a-real-token", accepted.token, revoked.token, expired.token].map(lookup),
    );
    for (const result of results) {
      expect(result).toEqual({ status: 404, body: { ok: false, error: { code: "INVITE_NOT_FOUND", message: "Invite is not available." } } });
    }
  });

  it("marks a pending invite as expired when it is looked up after expiry", async () => {
    const { token, id } = await inviteToken();
    fakeDb.get("userInvites", id)!.expiresAt = new Date(Date.now() - 1);
    await lookup(token);
    expect(fakeDb.get("userInvites", id)!.status).toBe("expired");
  });

  it("is rate limited", async () => {
    const { token } = await inviteToken();
    rateLimitAllowed = false;
    expect((await lookup(token)).status).toBe(429);
  });
});

describe("accepting an invite with a new password", () => {
  it("creates a verified account with the invited role and closes the invite", async () => {
    const { token, id } = await inviteToken({ role: "ADMIN", name: "New Person" });
    const { status, body } = await accept({ token, password: PASSWORD });
    expect(status).toBe(200);

    const uid = body.data.user.uid as string;
    expect(fakeAuth.users.get(uid)).toMatchObject({ email: "new.person@example.com", emailVerified: true, displayName: "New Person" });
    expect(fakeDb.get("users", uid)).toMatchObject({ role: "ADMIN", approved: true, disabled: false, inviteId: id, invitedByUid: "super" });
    expect(fakeDb.get("userInvites", id)).toMatchObject({ status: "accepted", acceptedByUid: uid });
    expect(fakeClaims.get(uid)).toEqual({ role: "ADMIN", approved: true, disabled: false });
  });

  it("the role comes from the invite, never from the request", async () => {
    const { token } = await inviteToken({ role: "VIEWER" });
    const { body } = await accept({ token, password: PASSWORD, role: "SUPER_ADMIN", approved: true });
    expect(fakeDb.get("users", body.data.user.uid)?.role).toBe("VIEWER");
  });

  it("a token works only once", async () => {
    const { token } = await inviteToken();
    expect((await accept({ token, password: PASSWORD })).status).toBe(200);
    const second = await accept({ token, password: PASSWORD });
    expect(second.status).toBe(409);
    expect(fakeAuth.users.size).toBe(1);
  });

  it("rejects weak passwords before touching anything", async () => {
    const { token } = await inviteToken();
    for (const password of ["short1", "allletterslongenough", "123456789012345"]) {
      expect((await accept({ token, password })).status).toBe(400);
    }
    expect(fakeAuth.users.size).toBe(0);
  });

  it("revoked, expired and unknown tokens create no account", async () => {
    const revoked = await inviteToken({ email: "r@example.com" });
    const expired = await inviteToken({ email: "e@example.com" });
    fakeDb.get("userInvites", revoked.id)!.status = "revoked";
    fakeDb.get("userInvites", expired.id)!.expiresAt = new Date(Date.now() - 1);

    expect((await accept({ token: revoked.token, password: PASSWORD })).status).toBe(410);
    expect((await accept({ token: expired.token, password: PASSWORD })).status).toBe(410);
    expect((await accept({ token: "x".repeat(43), password: PASSWORD })).status).toBe(404);
    expect(fakeAuth.users.size).toBe(0);
  });

  it("an email that already has an account is told to sign in instead", async () => {
    await fakeAuth.createUser({ email: "new.person@example.com", password: "existing" });
    const { token, id } = await inviteToken();
    expect((await accept({ token, password: PASSWORD })).status).toBe(409);
    expect(fakeDb.get("userInvites", id)!.status).toBe("pending");
  });

  it("if the invite is revoked mid-accept, the new account is rolled back", async () => {
    const { token, id } = await inviteToken();
    fakeAuth.afterCreate = () => {
      fakeDb.get("userInvites", id)!.status = "revoked";
    };
    expect((await accept({ token, password: PASSWORD })).status).toBe(410);
    expect(fakeAuth.users.size).toBe(0);
    expect(fakeAuth.deleted).toHaveLength(1);
    expect(fakeDb.col("users").size).toBe(0);
  });

  it("if Firestore fails mid-accept, the new account is rolled back", async () => {
    const { token, id } = await inviteToken();
    fakeDb.failNextTransaction = new Error("unavailable");
    expect((await accept({ token, password: PASSWORD })).status).toBe(500);
    expect(fakeAuth.users.size).toBe(0);
    expect(fakeDb.get("userInvites", id)!.status).toBe("pending");
  });

  it("is rate limited", async () => {
    const { token } = await inviteToken();
    rateLimitAllowed = false;
    expect((await accept({ token, password: PASSWORD })).status).toBe(429);
    expect(fakeAuth.users.size).toBe(0);
  });
});

describe("revoking invites", () => {
  const revoke = async (id: string) =>
    json(await revokeRoute.DELETE(req(`/api/admin/users/invites/${id}`, { method: "DELETE", actor: SUPER }), { params: Promise.resolve({ id }) }));

  it("revokes a pending invite, after which the token is dead", async () => {
    const { token, id } = await inviteToken();
    expect(await revoke(id)).toMatchObject({ status: 200, body: { data: { invite: { status: "revoked" } } } });
    expect(fakeDb.get("userInvites", id)).toMatchObject({ status: "revoked", revokedByUid: "super" });
    expect((await lookup(token)).status).toBe(404);
    expect((await accept({ token, password: PASSWORD })).status).toBe(410);
  });

  it("cannot revoke an accepted invite or one that does not exist", async () => {
    const { token, id } = await inviteToken();
    await accept({ token, password: PASSWORD });
    expect((await revoke(id)).status).toBe(409);
    expect((await revoke("missing")).status).toBe(404);
  });
});
