import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSessionForRequest } from "@/lib/api/adminSession";
import { syncUserClaims } from "@/lib/firebaseAdmin";
import { userRoleSchema } from "@/lib/validators";
import {
  getAdminUserById,
  updateAdminUser,
  type AdminUserUpdate,
} from "@/lib/data/users";

const adminUserUpdateSchema = z
  .object({
    role: userRoleSchema.optional(),
    approved: z.boolean().optional(),
    disabled: z.boolean().optional(),
  })
  .refine(
    (value) =>
      typeof value.role !== "undefined" ||
      typeof value.approved !== "undefined" ||
      typeof value.disabled !== "undefined",
    { message: "At least one of role, approved, or disabled must be provided." },
  );

type RouteContext = { params: Promise<{ uid: string }> };

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdminSessionForRequest(request, "users:manage");

  if (!auth.ok) {
    return jsonError(auth.reason, auth.message, auth.status);
  }

  const { uid: targetUid } = await context.params;

  if (!targetUid) {
    return jsonError("BAD_REQUEST", "Missing user id.", 400);
  }

  // Defensive: prevent self-mutation so a sole SUPER_ADMIN cannot demote,
  // disable, or unapprove themselves and lock everyone out.
  if (targetUid === auth.session.uid) {
    return jsonError(
      "SELF_MODIFICATION_BLOCKED",
      "You cannot change your own role or status from this screen.",
      403,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = adminUserUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid user update payload.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const existing = await getAdminUserById(targetUid);

  if (!existing) {
    return jsonError("NOT_FOUND", "User not found.", 404);
  }

  const update: AdminUserUpdate = parsed.data;

  try {
    await updateAdminUser(targetUid, update, auth.session.uid);
  } catch (error) {
    console.error("[admin/users PATCH] Firestore update failed:", error);
    return jsonError("UPDATE_FAILED", "Could not update the user.", 500);
  }

  const nextRole = update.role ?? existing.role;
  const nextApproved =
    typeof update.approved === "boolean" ? update.approved : existing.approved;
  const nextDisabled =
    typeof update.disabled === "boolean" ? update.disabled : existing.disabled;

  try {
    await syncUserClaims(targetUid, {
      role: nextRole ?? null,
      approved: nextApproved === true,
      disabled: nextDisabled === true,
    });
  } catch (error) {
    console.error("[admin/users PATCH] Claims sync failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CLAIMS_SYNC_FAILED",
          message:
            "User document updated, but token claims could not be refreshed. Retry the update or have the user sign out and back in.",
        },
      },
      { status: 500 },
    );
  }

  const updated = await getAdminUserById(targetUid);

  return NextResponse.json({ ok: true, data: { user: updated } });
}
