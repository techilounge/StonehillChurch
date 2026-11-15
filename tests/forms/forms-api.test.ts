/**
 * /api/forms: anonymous submissions (honeypot -> App Check -> rate limit ->
 * validation -> save -> notify) and the admin inbox endpoints. Real routes and
 * lib/data/formSubmissions.ts run against an in-memory Firestore.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { fakeDb, resetFakes } from "../helpers/fakeFirebase";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/firebaseAdmin", async () => (await import("../helpers/fakeFirebase")).firebaseAdminMock());

let appCheckAllowed = true;
vi.mock("@/lib/appCheck", () => ({
  checkAppCheckToken: async () => ({ allowed: appCheckAllowed, status: appCheckAllowed ? "valid" : "invalid" }),
}));

let rateLimitAllowed = true;
const rateLimitCalls: string[] = [];
vi.mock("@/lib/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rateLimit")>()),
  consumeRateLimit: async (_rule: unknown, id: string) => {
    rateLimitCalls.push(id);
    return { allowed: rateLimitAllowed, limit: 5, remaining: 0, resetAt: Date.now() + 60_000 };
  },
}));

let settings: Record<string, string> = {};
vi.mock("@/lib/data/siteSettings", () => ({ getCachedSiteSettings: async () => settings }));

vi.mock("@/lib/api/adminSession", () => ({
  requireAdminSessionForRequest: async (request: NextRequest, permission: string) => {
    const raw = request.headers.get("x-test-actor");
    const result = requirePermission(raw ? JSON.parse(raw) : null, permission as never);
    return result.ok ? result : { ...result, status: result.reason === "UNAUTHENTICATED" ? 401 : 403, message: "denied" };
  },
}));

const formsRoute = await import("@/app/api/forms/route");
const formRoute = await import("@/app/api/forms/[id]/route");

const ADMIN = { uid: "admin", role: "ADMIN", approved: true };
const EDITOR = { uid: "editor", role: "EDITOR", approved: true };
const contact = { formType: "contact", name: "Jane Doe", email: "jane@example.com", message: "Hello, I have a question about services." };

function req(url: string, init: { method?: string; actor?: object | null; body?: unknown; headers?: Record<string, string> } = {}) {
  const headers = new Headers({ "content-type": "application/json", ...init.headers });
  if (init.actor) headers.set("x-test-actor", JSON.stringify(init.actor));
  return new NextRequest(`https://church.example${url}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : typeof init.body === "string" ? init.body : JSON.stringify(init.body),
  });
}

async function submit(body: unknown, headers: Record<string, string> = {}) {
  const response = await formsRoute.POST(req("/api/forms", { method: "POST", body, headers }));
  return { status: response.status, headers: response.headers, body: await response.json() };
}

const stored = () => [...fakeDb.col("formSubmissions").values()];

let emails: Array<{ from: string; to: string[]; subject: string; text: string }> = [];

beforeEach(() => {
  resetFakes();
  appCheckAllowed = true;
  rateLimitAllowed = true;
  rateLimitCalls.length = 0;
  settings = {};
  emails = [];
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    emails.push(JSON.parse(init.body as string));
    return new Response("{}", { status: 200 });
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("public submission pipeline", () => {
  it("saves a valid submission as new, with nothing set by the visitor's say-so", async () => {
    const result = await submit({
      ...contact,
      status: "completed",
      assignedTo: "attacker",
      internalNotes: "pre-approved",
      createdAt: "2000-01-01",
    });
    expect(result.status).toBe(201);
    expect(stored()).toHaveLength(1);
    const doc = stored()[0]!;
    expect(doc).toMatchObject({ formType: "contact", name: "Jane Doe", status: "new", assignedTo: null, internalNotes: "" });
    expect(doc.createdAt).toBeInstanceOf(Date);
    expect(JSON.stringify(doc)).not.toContain("attacker");
    expect(JSON.stringify(doc)).not.toContain("pre-approved");
  });

  it("accepts the nested { formType, data } shape the forms send", async () => {
    const { formType, ...data } = contact;
    expect((await submit({ formType, data })).status).toBe(201);
    expect(stored()[0]).toMatchObject({ formType: "contact", email: "jane@example.com" });
  });

  it("400 with field errors for invalid input, and nothing saved", async () => {
    const result = await submit({ formType: "contact", name: "J", email: "nope", message: "hi" });
    expect(result.status).toBe(400);
    expect(Object.keys(result.body.error.fieldErrors).sort()).toEqual(["email", "message", "name"]);
    expect(stored()).toHaveLength(0);
  });

  it("400 for unknown form types and malformed JSON", async () => {
    expect((await submit({ ...contact, formType: "newsletter" })).status).toBe(400);
    expect((await submit("{oops")).body.error.code).toBe("INVALID_JSON");
    expect((await submit([contact])).status).toBe(400);
    expect(stored()).toHaveLength(0);
  });

  it("sets a sensible subject for each form type", async () => {
    const person = { name: "Jane Doe", email: "jane@example.com" };
    await submit({ ...person, formType: "prayer_request", message: "Please pray for us." });
    await submit({ ...person, formType: "maintenance_request", location: "Fellowship hall", issue: "Leaking faucet" });
    await submit({ ...person, formType: "plan_your_visit", visitDate: "Next Sabbath" });
    await submit({ ...person, formType: "announcement_request", announcementTitle: "Bake sale", announcementBody: "Sunday after church." });
    expect(stored().map((d) => d.subject)).toEqual(["Prayer request", "Fellowship hall", "Visit Plan: Next Sabbath", "Bake sale"]);
  });

  describe("bot defenses run in order and stop early", () => {
    for (const trap of ["website", "company", "url", "homepage", "honeypot", "_gotcha"]) {
      it(`honeypot "${trap}" gets a fake success with nothing saved or counted`, async () => {
        const result = await submit({ ...contact, [trap]: "http://spam.example" });
        expect(result).toMatchObject({ status: 202, body: { ok: true, data: { submission: null, accepted: true } } });
        expect(stored()).toHaveLength(0);
        expect(rateLimitCalls).toHaveLength(0);
      });
    }

    it("the honeypot is also checked inside the nested data shape", async () => {
      const { formType, ...data } = contact;
      expect((await submit({ formType, data: { ...data, website: "x" } })).status).toBe(202);
      expect(stored()).toHaveLength(0);
    });

    it("an empty honeypot (what real visitors send) is ignored", async () => {
      expect((await submit({ ...contact, website: "   " })).status).toBe(201);
    });

    it("failed App Check (enforce mode) is refused before the rate limiter", async () => {
      appCheckAllowed = false;
      const result = await submit(contact);
      expect(result).toMatchObject({ status: 401, body: { error: { code: "APP_CHECK_FAILED" } } });
      expect(rateLimitCalls).toHaveLength(0);
      expect(stored()).toHaveLength(0);
    });

    it("rate limited clients get 429 with retry headers and nothing saved", async () => {
      rateLimitAllowed = false;
      const result = await submit(contact);
      expect(result.status).toBe(429);
      expect(result.headers.get("retry-after")).not.toBeNull();
      expect(stored()).toHaveLength(0);
    });

    it("the rate limit is keyed on the client IP Vercel reports", async () => {
      await submit(contact, { "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1, 203.0.113.7" });
      expect(rateLimitCalls).toEqual(["203.0.113.7"]);
    });
  });

  it("a Firestore failure returns a generic 500", async () => {
    vi.spyOn(fakeDb, "collection").mockImplementationOnce(() => {
      throw new Error("internal details");
    });
    const result = await submit(contact);
    expect(result).toMatchObject({ status: 500, body: { error: { code: "SUBMISSION_FAILED" } } });
    expect(JSON.stringify(result.body)).not.toContain("internal details");
  });
});

describe("notification emails", () => {
  const prayer = { formType: "prayer_request", name: "Jane Doe", email: "jane@example.com", message: "Please pray for my family." };

  beforeEach(() => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    settings = {
      "notifications.contactForm.recipients": "office@example.com",
      "notifications.contactForm.senderName": "Stonehill Office",
      "notifications.prayerTeam.recipients": "team1@example.com, team2@example.com",
      "notifications.prayerTeam.senderName": "Prayer Team",
      "notifications.confidential.recipients": "pastor@example.com",
      "notifications.confidential.senderName": "Pastor",
      "notifications.adminInbox": "inbox@example.com",
    };
  });

  it("contact forms go to the contact recipients", async () => {
    await submit(contact);
    expect(emails).toHaveLength(1);
    expect(emails[0]).toMatchObject({ to: ["office@example.com"], from: "Stonehill Office <onboarding@resend.dev>" });
  });

  it("prayer requests go to the prayer team", async () => {
    await submit(prayer);
    expect(emails[0]!.to).toEqual(["team1@example.com", "team2@example.com"]);
  });

  it("confidential prayer requests go only to the confidential list", async () => {
    await submit({ ...prayer, confidential: true });
    expect(emails).toHaveLength(1);
    expect(emails[0]!.to).toEqual(["pastor@example.com"]);
  });

  it("falls back to the admin inbox when a scenario has no recipients", async () => {
    delete settings["notifications.prayerTeam.recipients"];
    await submit(prayer);
    expect(emails[0]!.to).toEqual(["inbox@example.com"]);
  });

  it("sends nothing without a Resend key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await submit(contact);
    expect(emails).toHaveLength(0);
  });

  it("only an excerpt of the message is emailed, with a link to the admin inbox", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://church.example");
    const long = "A".repeat(300);
    await submit({ ...contact, message: long });
    expect(emails[0]!.text).toContain("A".repeat(100) + "...");
    expect(emails[0]!.text).not.toContain("A".repeat(101));
    expect(emails[0]!.text).toMatch(/https:\/\/church\.example\/admin\/forms\/\S+/);
  });

  it("an email failure does not lose the submission", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("network down");
    });
    expect((await submit(contact)).status).toBe(201);
    expect(stored()).toHaveLength(1);
  });
});

describe("admin inbox endpoints", () => {
  beforeEach(async () => {
    fakeDb.seed("formSubmissions", "s1", { ...contact, status: "new", formType: "contact", internalNotes: "" });
    fakeDb.seed("formSubmissions", "s2", { ...contact, status: "completed", formType: "volunteer", internalNotes: "" });
  });

  const list = async (query = "", actor: object | null = ADMIN) => {
    const response = await formsRoute.GET(req(`/api/forms${query}`, { actor }));
    return { status: response.status, body: await response.json() };
  };
  const getOne = async (id: string, actor: object | null = ADMIN) => {
    const response = await formRoute.GET(req(`/api/forms/${id}`, { actor }), { params: Promise.resolve({ id }) });
    return { status: response.status, body: await response.json() };
  };
  const patch = async (id: string, body: unknown, actor: object | null = ADMIN) => {
    const response = await formRoute.PATCH(req(`/api/forms/${id}`, { method: "PATCH", body, actor }), { params: Promise.resolve({ id }) });
    return { status: response.status, body: await response.json() };
  };

  it("visitors and editors cannot read or change submissions", async () => {
    for (const actor of [null, EDITOR, { uid: "v", role: "VIEWER", approved: true }]) {
      expect((await list("", actor)).status).toBeGreaterThanOrEqual(401);
      expect((await getOne("s1", actor)).status).toBeGreaterThanOrEqual(401);
      expect((await patch("s1", { status: "archived" }, actor)).status).toBeGreaterThanOrEqual(401);
    }
    expect(fakeDb.get("formSubmissions", "s1")!.status).toBe("new");
  });

  it("admins can list, filter and open submissions", async () => {
    expect((await list()).body.data.submissions).toHaveLength(2);
    expect((await list("?formType=volunteer")).body.data.submissions.map((s: { id: string }) => s.id)).toEqual(["s2"]);
    expect((await list("?status=new")).body.data.submissions.map((s: { id: string }) => s.id)).toEqual(["s1"]);
    expect((await getOne("s1")).body.data.submission).toMatchObject({ id: "s1", name: "Jane Doe" });
    expect((await getOne("missing")).status).toBe(404);
  });

  it("rejects unknown filters", async () => {
    expect((await list("?formType=bogus")).body.error.code).toBe("INVALID_FORM_TYPE");
    expect((await list("?status=bogus")).body.error.code).toBe("INVALID_STATUS");
  });

  it("admins can update status, assignee and notes, and the change is attributed", async () => {
    const result = await patch("s1", { status: "in_review", assignedTo: " Pastor Ray ", internalNotes: "  called back  " });
    expect(result.status).toBe(200);
    expect(fakeDb.get("formSubmissions", "s1")).toMatchObject({
      status: "in_review",
      assignedTo: "Pastor Ray",
      internalNotes: "called back",
      statusUpdatedBy: "admin",
    });
  });

  it("a status update cannot rewrite what the visitor submitted", async () => {
    await patch("s1", { status: "completed", name: "Someone Else", message: "edited", email: "x@example.com" });
    expect(fakeDb.get("formSubmissions", "s1")).toMatchObject({ status: "completed", name: "Jane Doe", email: "jane@example.com" });
  });

  it("validates status updates", async () => {
    expect((await patch("s1", { status: "deleted" })).status).toBe(400);
    expect((await patch("s1", {})).status).toBe(400);
    expect((await patch("missing", { status: "archived" })).status).toBe(404);
  });
});
