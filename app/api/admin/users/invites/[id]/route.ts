import { NextRequest, NextResponse } from "next/server";
import { requireAdminSessionForRequest } from "@/lib/api/adminSession";
import { revokeUserInvite, InviteFlowError } from "@/lib/data/userInvites";

type RouteContext = { params: Promise<{ id: string }> };

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdminSessionForRequest(request, "users:manage");

  if (!auth.ok) {
    return jsonError(auth.reason, auth.message, auth.status);
  }

  const { id } = await context.params;
  if (!id) {
    return jsonError("BAD_REQUEST", "Missing invite id.", 400);
  }

  try {
    const invite = await revokeUserInvite({ inviteId: id, actor: auth.session });
    return NextResponse.json({ ok: true, data: { invite } });
  } catch (error) {
    if (error instanceof InviteFlowError) {
      return jsonError(error.code, error.message, error.status);
    }
    console.error("[invites DELETE] unexpected error:", error);
    return jsonError("INVITE_REVOKE_FAILED", "Could not revoke invite.", 500);
  }
}
