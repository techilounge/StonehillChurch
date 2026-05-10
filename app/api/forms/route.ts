import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionForRequest } from "@/lib/api/adminSession";
import {
  createFormSubmission,
  listFormSubmissions,
} from "@/lib/data/formSubmissions";
import {
  formSubmissionStatusSchema,
  formTypeSchema,
  publicFormSubmissionSchema,
} from "@/lib/validators";
import type {
  FormApiError,
  FormApiResponse,
  FormSubmissionPayload,
  PublicFormSubmissionInput,
} from "@/types/forms";
import type { FormSubmissionStatus } from "@/types/shared";

type PublicFormSubmission = z.infer<typeof publicFormSubmissionSchema>;

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

function payloadValue(value: unknown): FormSubmissionPayload[string] | undefined {
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) {
    return value as FormSubmissionPayload[string];
  }

  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }

  return undefined;
}

function payloadFromSubmission(submission: PublicFormSubmission): FormSubmissionPayload {
  return Object.entries(submission).reduce<FormSubmissionPayload>((payload, [key, value]) => {
    const nextValue = payloadValue(value);
    if (typeof nextValue !== "undefined") {
      payload[key] = nextValue;
    }
    return payload;
  }, {});
}

function defaultSubject(submission: PublicFormSubmission): string {
  switch (submission.formType) {
    case "contact":
      return submission.subject ?? "Contact form";
    case "prayer_request":
      return submission.subject ?? "Prayer request";
    case "volunteer":
      return submission.subject ?? "Volunteer inquiry";
    case "announcement_request":
      return submission.announcementTitle;
    case "membership_transfer":
      return submission.subject ?? "Membership transfer";
    case "maintenance_request":
      return submission.location;
  }
}

function toFormSubmissionInput(submission: PublicFormSubmission): PublicFormSubmissionInput {
  return {
    formType: submission.formType,
    name: submission.name,
    email: submission.email,
    phone: submission.phone ?? null,
    subject: defaultSubject(submission),
    message: submission.message,
    payloadJson: payloadFromSubmission(submission),
  };
}

function normalizeRequestPayload(body: unknown): unknown {
  if (!body || typeof body !== "object") {
    return body;
  }

  const record = body as Record<string, unknown>;

  if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
    return {
      ...(record.data as Record<string, unknown>),
      formType: record.formType ?? (record.data as Record<string, unknown>).formType,
    };
  }

  return record;
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = publicFormSubmissionSchema.safeParse(normalizeRequestPayload(body));

  if (!parsed.success) {
    return jsonError(
      "VALIDATION_ERROR",
      "Please check the form fields and try again.",
      400,
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const submission = await createFormSubmission(toFormSubmissionInput(parsed.data));
    return jsonSuccess({ submission }, 201);
  } catch {
    return jsonError("SUBMISSION_FAILED", "Could not save the form submission.", 500);
  }
}

export async function GET(request: NextRequest) {
  const session = await getAdminSessionForRequest(request, "forms:manage");

  if (!session) {
    return jsonError("FORBIDDEN", "You are not authorized to review form submissions.", 403);
  }

  const searchParams = request.nextUrl.searchParams;
  const formTypeParam = searchParams.get("formType");
  const statusParam = searchParams.get("status");
  const limitParam = searchParams.get("limit");
  const formType = formTypeParam ? formTypeSchema.safeParse(formTypeParam) : null;
  const status = statusParam ? formSubmissionStatusSchema.safeParse(statusParam) : null;

  if (formType && !formType.success) {
    return jsonError("INVALID_FORM_TYPE", "Unknown form type.");
  }

  if (status && !status.success) {
    return jsonError("INVALID_STATUS", "Unknown form submission status.");
  }

  try {
    const submissions = await listFormSubmissions({
      formType: formType?.success ? formType.data : undefined,
      status: status?.success ? (status.data as FormSubmissionStatus) : undefined,
      limit: limitParam ? Number(limitParam) : undefined,
    });

    return jsonSuccess({ submissions });
  } catch {
    return jsonError("LIST_FAILED", "Could not load form submissions.", 500);
  }
}
