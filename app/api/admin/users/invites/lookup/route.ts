import { NextRequest, NextResponse } from "next/server";
import { validateUserInviteToken, InviteFlowError } from "@/lib/data/userInvites";
import {
  clientIpFromHeaders,
  consumeRateLimit,
  rateLimitHeaders,
  type RateLimitRule,
} from "@/lib/rateLimit";

function notFound() {
  // Single canonical failure response — never reveal which error condition
  // matched. Prevents enumeration of valid-but-expired or valid-but-accepted
  // tokens by anonymous probing.
  return NextResponse.json(
    { ok: false, error: { code: "INVITE_NOT_FOUND", message: "Invite is not available." } },
    { status: 404 },
  );
}

const LOOKUP_RATE_LIMIT: RateLimitRule = {
  scope: "invite-lookup",
  limit: 30,
  windowMs: 15 * 60 * 1000,
};

export async function GET(request: NextRequest) {
  const rateLimit = await consumeRateLimit(LOOKUP_RATE_LIMIT, clientIpFromHeaders(request.headers));
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "Too many attempts. Please try again later." } },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return notFound();
  }

  try {
    const invite = await validateUserInviteToken(token);
    return NextResponse.json({
      ok: true,
      data: {
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof InviteFlowError) {
      return notFound();
    }
    console.error("[invites lookup] unexpected error:", error);
    return notFound();
  }
}
