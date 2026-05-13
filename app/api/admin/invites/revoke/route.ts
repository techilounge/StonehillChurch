import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSessionForRequest } from "@/lib/api/adminSession";
import {
  InviteFlowError,
  revokeUserInvite,
} from "@/lib/data/userInvites";
import { SUPER_ADMIN } from "@/types/auth";

const revokeInviteSchema = z.object({
  inviteId: z.string().trim().min(1).max(200),
});

function jsonError(
  code: string,
  message: string,
  status = 400,
  fieldErrors?: Record<string, string[]>,
) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {}),
      },
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSessionForRequest(request, "admin:access");

  if (!auth.ok) {
    return jsonError(auth.reason, auth.message, auth.status);
  }

  if (auth.session.role !== SUPER_ADMIN) {
    return jsonError("FORBIDDEN", "Only SUPER_ADMIN users can revoke invites.", 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = revokeInviteSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Invalid revoke payload.",
      400,
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const invite = await revokeUserInvite({
      inviteId: parsed.data.inviteId,
      actor: auth.session,
    });

    return NextResponse.json({ ok: true, data: { invite } });
  } catch (error) {
    if (error instanceof InviteFlowError) {
      return jsonError(error.code, error.message, error.status);
    }

    console.error("[admin/invites/revoke] Failed to revoke invite:", error);
    return jsonError("INVITE_REVOKE_FAILED", "Could not revoke invite.", 500);
  }
}
