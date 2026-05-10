import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionForRequest } from "@/lib/api/adminSession";
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

async function requireFormsAdmin(request: NextRequest) {
  return getAdminSessionForRequest(request, "forms:manage");
}

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await requireFormsAdmin(request);

  if (!session) {
    return jsonError("FORBIDDEN", "You are not authorized to review form submissions.", 403);
  }

  const { id } = await context.params;
  const submission = await getFormSubmissionById(id);

  if (!submission) {
    return jsonError("NOT_FOUND", "Form submission not found.", 404);
  }

  return jsonSuccess({ submission });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireFormsAdmin(request);

  if (!session) {
    return jsonError("FORBIDDEN", "You are not authorized to update form submissions.", 403);
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
  const submission = await updateFormSubmissionStatus(id, parsed.data, session.uid);

  if (!submission) {
    return jsonError("NOT_FOUND", "Form submission not found.", 404);
  }

  return jsonSuccess({ submission });
}
