import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSessionForRequest } from "@/lib/api/adminSession";
import {
  InviteFlowError,
  createUserInvite,
} from "@/lib/data/userInvites";
import { invitableUserRoleSchema } from "@/lib/validators";
import { SUPER_ADMIN } from "@/types/auth";

const createInviteSchema = z.object({
  email: z.string().trim().email(),
  name: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .optional()
    .nullable(),
  role: invitableUserRoleSchema,
  expiresInDays: z.number().int().min(1).max(30).optional(),
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
    return jsonError("FORBIDDEN", "Only SUPER_ADMIN users can create invites.", 403);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = createInviteSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Invalid invite payload.",
      400,
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const result = await createUserInvite({
      ...parsed.data,
      actor: auth.session,
      origin: request.nextUrl.origin,
    });

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof InviteFlowError) {
      return jsonError(error.code, error.message, error.status);
    }

    console.error("[admin/invites POST] Failed to create invite:", error);
    return jsonError("INVITE_CREATE_FAILED", "Could not create invite.", 500);
  }
}
