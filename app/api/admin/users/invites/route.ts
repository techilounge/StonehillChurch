import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSessionForRequest } from "@/lib/api/adminSession";
import { collections } from "@/lib/constants/collections";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { createUserInvite, InviteFlowError } from "@/lib/data/userInvites";
import { invitableUserRoleSchema } from "@/lib/validators";
import { serializeData } from "@/lib/data/utils";
import type { UserInvite } from "@/types/invites";

const createInviteSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(120).optional(),
  role: invitableUserRoleSchema,
  expiresInDays: z.number().int().min(1).max(30).optional(),
});

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

function originFromRequest(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");
  const fromHeader = request.headers.get("origin");
  if (fromHeader) return fromHeader.replace(/\/$/, "");
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSessionForRequest(request, "users:manage");

  if (!auth.ok) {
    return jsonError(auth.reason, auth.message, auth.status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = createInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid invite payload.",
          fieldErrors: z.flattenError(parsed.error).fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  try {
    const result = await createUserInvite({
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      role: parsed.data.role,
      expiresInDays: parsed.data.expiresInDays,
      actor: auth.session,
      origin: originFromRequest(request),
    });

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof InviteFlowError) {
      return jsonError(error.code, error.message, error.status);
    }
    console.error("[invites POST] unexpected error:", error);
    return jsonError("INVITE_CREATE_FAILED", "Could not create invite.", 500);
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminSessionForRequest(request, "users:manage");

  if (!auth.ok) {
    return jsonError(auth.reason, auth.message, auth.status);
  }

  try {
    const snapshot = await getAdminFirestore()
      .collection(collections.userInvites)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const invites = snapshot.docs.map((doc) => {
      const data = { id: doc.id, ...(doc.data() as UserInvite) };
      const serialized = serializeData(data) as Record<string, unknown>;
      // Never expose the token hash to the client.
      delete serialized.tokenHash;
      return serialized;
    });

    return NextResponse.json({ ok: true, data: { invites } });
  } catch (error) {
    console.error("[invites GET] list failed:", error);
    return jsonError("LIST_FAILED", "Could not load invites.", 500);
  }
}
