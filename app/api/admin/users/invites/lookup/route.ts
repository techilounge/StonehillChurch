import { NextRequest, NextResponse } from "next/server";
import { validateUserInviteToken, InviteFlowError } from "@/lib/data/userInvites";

function notFound() {
  // Single canonical failure response — never reveal which error condition
  // matched. Prevents enumeration of valid-but-expired or valid-but-accepted
  // tokens by anonymous probing.
  return NextResponse.json(
    { ok: false, error: { code: "INVITE_NOT_FOUND", message: "Invite is not available." } },
    { status: 404 },
  );
}

export async function GET(request: NextRequest) {
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
