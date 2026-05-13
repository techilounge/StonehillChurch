import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBearerToken } from "@/lib/api/adminSession";
import {
  InviteFlowError,
  acceptUserInvite,
} from "@/lib/data/userInvites";

const acceptInviteSchema = z.object({
  token: z.string().trim().min(20),
  idToken: z.string().trim().min(20).optional(),
  name: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .optional()
    .nullable(),
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
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = acceptInviteSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Invalid invite acceptance payload.",
      400,
      parsed.error.flatten().fieldErrors,
    );
  }

  const idToken = parsed.data.idToken ?? getBearerToken(request);

  if (!idToken) {
    return jsonError("UNAUTHENTICATED", "A Firebase ID token is required.", 401);
  }

  try {
    const result = await acceptUserInvite({
      token: parsed.data.token,
      idToken,
      name: parsed.data.name,
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof InviteFlowError) {
      return jsonError(error.code, error.message, error.status);
    }

    console.error("[admin/invites/accept] Failed to accept invite:", error);
    return jsonError("INVITE_ACCEPT_FAILED", "Could not accept invite.", 500);
  }
}
