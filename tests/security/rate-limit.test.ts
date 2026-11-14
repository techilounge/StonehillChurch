import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

// In-memory stand-in for the Firestore transaction API used by the limiter.
const store = new Map<string, Record<string, unknown>>();
let failTransactions = false;

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminFirestore: () => ({
    collection: (name: string) => ({
      doc: (id: string) => ({ path: `${name}/${id}` }),
    }),
    runTransaction: async <T>(
      fn: (tx: {
        get: (ref: { path: string }) => Promise<{ exists: boolean; data: () => unknown }>;
        set: (ref: { path: string }, data: Record<string, unknown>) => void;
      }) => Promise<T>,
    ) => {
      if (failTransactions) throw new Error("firestore unavailable");
      return fn({
        get: async (ref) => ({ exists: store.has(ref.path), data: () => store.get(ref.path) }),
        set: (ref, data) => {
          store.set(ref.path, data);
        },
      });
    },
  }),
}));

const {
  applyFixedWindow,
  clientIpFromHeaders,
  consumeRateLimit,
  rateLimitHeaders,
  rateLimitKey,
} = await import("@/lib/rateLimit");

const rule = { scope: "test", limit: 3, windowMs: 60_000 };

beforeEach(() => {
  store.clear();
  failTransactions = false;
});

describe("applyFixedWindow", () => {
  it("allows up to the limit within a window, then blocks", () => {
    let stored = null;
    const decisions: boolean[] = [];
    for (let i = 0; i < 5; i += 1) {
      const { next, result } = applyFixedWindow(stored, rule, 1_000 + i);
      decisions.push(result.allowed);
      stored = next ?? stored;
    }
    expect(decisions).toEqual([true, true, true, false, false]);
  });

  it("reports remaining requests and the window reset time", () => {
    const first = applyFixedWindow(null, rule, 1_000);
    expect(first.result).toEqual({ allowed: true, limit: 3, remaining: 2, resetAt: 61_000 });
  });

  it("starts a fresh window once the previous one has elapsed", () => {
    const blocked = { count: 3, windowStart: 0 };
    expect(applyFixedWindow(blocked, rule, 59_999).result.allowed).toBe(false);
    const { next, result } = applyFixedWindow(blocked, rule, 60_000);
    expect(result.allowed).toBe(true);
    expect(next).toEqual({ count: 1, windowStart: 60_000 });
  });

  it("does not extend the window for rejected requests", () => {
    const { next } = applyFixedWindow({ count: 3, windowStart: 0 }, rule, 30_000);
    expect(next).toBeNull();
  });
});

describe("consumeRateLimit", () => {
  it("shares state through the store and blocks after the limit", async () => {
    const results = [];
    for (let i = 0; i < 4; i += 1) {
      results.push(await consumeRateLimit(rule, "203.0.113.7", 10_000));
    }
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(store.size).toBe(1);
  });

  it("keeps separate counters per scope and per client", async () => {
    for (let i = 0; i < 3; i += 1) await consumeRateLimit(rule, "203.0.113.7", 10_000);
    expect((await consumeRateLimit(rule, "203.0.113.8", 10_000)).allowed).toBe(true);
    expect((await consumeRateLimit({ ...rule, scope: "other" }, "203.0.113.7", 10_000)).allowed).toBe(true);
  });

  it("never stores the raw client IP and sets an expiry for TTL cleanup", async () => {
    await consumeRateLimit(rule, "203.0.113.7", 10_000);
    const [[path, doc]] = [...store.entries()];
    expect(path).not.toContain("203.0.113.7");
    expect(JSON.stringify(doc)).not.toContain("203.0.113.7");
    expect((doc.expiresAt as { toMillis: () => number }).toMillis()).toBe(70_000);
  });

  it("fails open when Firestore is unavailable", async () => {
    failTransactions = true;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await consumeRateLimit(rule, "203.0.113.7", 10_000)).allowed).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("helpers", () => {
  it("hashes keys deterministically and namespaces them by scope", () => {
    expect(rateLimitKey("a", "1.2.3.4")).toMatch(/^[0-9a-f]{64}$/);
    expect(rateLimitKey("a", "1.2.3.4")).toBe(rateLimitKey("a", "1.2.3.4"));
    expect(rateLimitKey("a", "1.2.3.4")).not.toBe(rateLimitKey("b", "1.2.3.4"));
  });

  it("prefers x-real-ip, then the first x-forwarded-for entry", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "2.2.2.2, 3.3.3.3" }))).toBe("2.2.2.2");
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });

  it("builds Retry-After and RateLimit headers", () => {
    const headers = rateLimitHeaders({ allowed: false, limit: 5, remaining: 0, resetAt: 90_500 }, 30_000);
    expect(headers).toMatchObject({
      "Retry-After": "61",
      "RateLimit-Limit": "5",
      "RateLimit-Remaining": "0",
    });
  });
});
