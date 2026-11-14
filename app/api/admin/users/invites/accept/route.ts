import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { acceptUserInviteWithPassword, InviteFlowError } from "@/lib/data/userInvites";
import {
  clientIpFromHeaders,
  consumeRateLimit,
  rateLimitHeaders,
  type RateLimitRule,
} from "@/lib/rateLimit";

const acceptSchema = z.object({
  token: z.string().trim().min(20).max(200),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .max(200)
    .regex(/[A-Za-z]/, "Password must contain at least one letter.")
    .regex(/\d/, "Password must contain at least one number."),
  name: z.string().trim().min(2).max(120).optional(),
});

// Accepting an invite creates a verified Firebase Auth user on token possession
// alone, so cap attempts per client to slow token guessing.
const ACCEPT_RATE_LIMIT: RateLimitRule = {
  scope: "invite-accept",
  limit: 10,
  windowMs: 15 * 60 * 1000,
};

function jsonError(code: string, message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status, headers });
}

export async function POST(request: NextRequest) {
  const rateLimit = await consumeRateLimit(ACCEPT_RATE_LIMIT, clientIpFromHeaders(request.headers));
  if (!rateLimit.allowed) {
    return jsonError(
      "RATE_LIMITED",
      "Too many attempts. Please wait a few minutes and try again.",
      429,
      rateLimitHeaders(rateLimit),
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid invite acceptance payload.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await acceptUserInviteWithPassword({
      token: parsed.data.token,
      password: parsed.data.password,
      name: parsed.data.name ?? null,
    });
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof InviteFlowError) {
      return jsonError(error.code, error.message, error.status);
    }
    console.error("[invites accept] unexpected error:", error);
    return jsonError("INVITE_ACCEPT_FAILED", "Could not accept invite.", 500);
  }
}
