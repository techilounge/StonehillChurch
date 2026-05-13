import { NextRequest, NextResponse } from "next/server";
import {
  InviteFlowError,
  validateUserInviteToken,
} from "@/lib/data/userInvites";

function jsonError(code: string, message: string, status = 400) {
  return NextResponse.json(
    {
      ok: false,
      error: { code, message },
    },
    { status },
  );
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";

  try {
    const invite = await validateUserInviteToken(token);
    return NextResponse.json({ ok: true, data: { invite } });
  } catch (error) {
    if (error instanceof InviteFlowError) {
      return jsonError(error.code, error.message, error.status);
    }

    console.error("[admin/invites/validate] Failed to validate invite:", error);
    return jsonError("INVITE_VALIDATE_FAILED", "Could not validate invite.", 500);
  }
}
