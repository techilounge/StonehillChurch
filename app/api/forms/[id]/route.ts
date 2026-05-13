import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminSessionForRequest,
  type AdminRequestAuthResult,
} from "@/lib/api/adminSession";
import {
  getFormSubmissionById,
  updateFormSubmissionStatus,
} from "@/lib/data/formSubmissions";
import { formSubmissionStatusUpdateSchema } from "@/lib/validators";
import type { FormApiError, FormApiResponse } from "@/types/forms";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function jsonSuccess<T>(data: T, status = 200): NextResponse<FormApiResponse<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

function jsonError(
  code: string,
  message: string,
  status = 400,
  fieldErrors?: Record<string, string[]>,
): NextResponse<FormApiError> {
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

function jsonAuthError(authResult: Extract<AdminRequestAuthResult, { ok: false }>) {
  return jsonError(authResult.reason, authResult.message, authResult.status);
}

async function requireFormsAdmin(request: NextRequest) {
  return requireAdminSessionForRequest(request, "forms:manage");
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authResult = await requireFormsAdmin(request);

  if (!authResult.ok) {
    return jsonAuthError(authResult);
  }

  const { id } = await context.params;
  let submission;

  try {
    submission = await getFormSubmissionById(id);
  } catch (error) {
    console.error("[forms] Failed to load form submission.", error);
    return jsonError("LOAD_FAILED", "Could not load the form submission.", 500);
  }

  if (!submission) {
    return jsonError("NOT_FOUND", "Form submission not found.", 404);
  }

  return jsonSuccess({ submission });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireFormsAdmin(request);

  if (!authResult.ok) {
    return jsonAuthError(authResult);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = formSubmissionStatusUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Please check the status update fields and try again.",
      400,
      parsed.error.flatten().fieldErrors,
    );
  }

  const { id } = await context.params;
  let submission;

  try {
    submission = await updateFormSubmissionStatus(id, parsed.data, authResult.session.uid);
  } catch (error) {
    console.error("[forms] Failed to update form submission.", error);
    return jsonError("UPDATE_FAILED", "Could not update the form submission.", 500);
  }

  if (!submission) {
    return jsonError("NOT_FOUND", "Form submission not found.", 404);
  }

  return jsonSuccess({ submission });
}
