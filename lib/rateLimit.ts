import "server-only";

import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";

/**
 * Shared fixed-window rate limiter backed by Firestore.
 *
 * The previous limiter kept counts in a module-level Map, which is per
 * serverless instance and reset on every cold start, so limits were not
 * enforced on Vercel. Counts now live in the `rateLimits` collection and are
 * updated inside a transaction, so every instance sees the same window.
 *
 * - Keys are SHA-256 hashes of `scope:identifier`; raw IPs are never stored.
 * - Each document carries `expiresAt`. Configure a Firestore TTL policy on
 *   `rateLimits.expiresAt` so stale windows are deleted automatically.
 * - The limiter fails open: if Firestore is unavailable the request is allowed
 *   and a warning is logged, so an outage never blocks legitimate visitors.
 *   Layered defenses (honeypot, validation) still apply.
 */

export type RateLimitRule = {
  /** Namespace so different endpoints keep independent counters. */
  scope: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Epoch milliseconds when the current window resets. */
  resetAt: number;
};

export type RateLimitWindow = { count: number; windowStart: number };

/**
 * Pure fixed-window transition: given the stored window (if any), returns the
 * window to persist and the decision. Rejected requests do not extend or
 * increment the window, so a blocked client recovers on schedule.
 */
export function applyFixedWindow(
  stored: RateLimitWindow | null,
  rule: Pick<RateLimitRule, "limit" | "windowMs">,
  now: number,
): { next: RateLimitWindow | null; result: RateLimitResult } {
  const current =
    stored && now - stored.windowStart < rule.windowMs ? stored : { count: 0, windowStart: now };
  const resetAt = current.windowStart + rule.windowMs;

  if (current.count >= rule.limit) {
    return {
      next: null,
      result: { allowed: false, limit: rule.limit, remaining: 0, resetAt },
    };
  }

  const count = current.count + 1;
  return {
    next: { count, windowStart: current.windowStart },
    result: { allowed: true, limit: rule.limit, remaining: rule.limit - count, resetAt },
  };
}

export function rateLimitKey(scope: string, identifier: string): string {
  return createHash("sha256").update(`${scope}:${identifier}`).digest("hex");
}

/**
 * Best-effort client IP. On Vercel, `x-real-ip` and `x-forwarded-for` are set
 * by the platform proxy and overwritten to prevent client spoofing.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || "unknown";
}

export async function consumeRateLimit(
  rule: RateLimitRule,
  identifier: string,
  now: number = Date.now(),
): Promise<RateLimitResult> {
  const docRef = getAdminFirestore()
    .collection(collections.rateLimits)
    .doc(rateLimitKey(rule.scope, identifier));

  try {
    return await getAdminFirestore().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(docRef);
      const data = snapshot.exists ? snapshot.data() : undefined;
      const stored: RateLimitWindow | null =
        data && typeof data.count === "number" && data.windowStart instanceof Timestamp
          ? { count: data.count, windowStart: data.windowStart.toMillis() }
          : null;

      const { next, result } = applyFixedWindow(stored, rule, now);
      if (next) {
        transaction.set(docRef, {
          scope: rule.scope,
          count: next.count,
          windowStart: Timestamp.fromMillis(next.windowStart),
          expiresAt: Timestamp.fromMillis(next.windowStart + rule.windowMs),
        });
      }
      return result;
    });
  } catch (error) {
    console.warn(`[rateLimit] ${rule.scope}: limiter unavailable, allowing request.`, error);
    return { allowed: true, limit: rule.limit, remaining: rule.limit, resetAt: now + rule.windowMs };
  }
}

/** Standard headers for a 429 response. */
export function rateLimitHeaders(result: RateLimitResult, now: number = Date.now()): HeadersInit {
  return {
    "Retry-After": String(Math.max(1, Math.ceil((result.resetAt - now) / 1000))),
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.max(0, Math.ceil((result.resetAt - now) / 1000))),
  };
}
