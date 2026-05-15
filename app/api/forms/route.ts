import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  requireAdminSessionForRequest,
  type AdminRequestAuthResult,
} from "@/lib/api/adminSession";
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

const HONEYPOT_FIELDS = ["website", "company", "url", "homepage", "honeypot", "_gotcha"] as const;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_POSTS = 5;
const submissionAttempts = new Map<string, { count: number; resetAt: number }>();

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

function requestIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(request: NextRequest): boolean {
  const key = requestIp(request);
  const now = Date.now();
  const current = submissionAttempts.get(key);

  if (!current || current.resetAt <= now) {
    submissionAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  submissionAttempts.set(key, current);
  return current.count > RATE_LIMIT_MAX_POSTS;
}

function hasHoneypotValue(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return false;
  }

  const record = body as Record<string, unknown>;
  const candidates = [
    record,
    record.data && typeof record.data === "object" && !Array.isArray(record.data)
      ? (record.data as Record<string, unknown>)
      : null,
  ].filter((value): value is Record<string, unknown> => value !== null);

  return candidates.some((candidate) =>
    HONEYPOT_FIELDS.some((field) => {
      const value = candidate[field];
      return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
    }),
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
    case "plan_your_visit":
      return `Visit Plan: ${submission.visitDate}`;
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

  if (hasHoneypotValue(body)) {
    return jsonSuccess({ submission: null, accepted: true }, 202);
  }

  if (isRateLimited(request)) {
    return jsonError(
      "RATE_LIMITED",
      "Too many form submissions were received. Please wait a few minutes and try again.",
      429,
    );
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
  } catch (error) {
    console.error("[forms] Failed to save form submission.", error);
    return jsonError("SUBMISSION_FAILED", "Could not save the form submission.", 500);
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminSessionForRequest(request, "forms:manage");

  if (!authResult.ok) {
    return jsonAuthError(authResult);
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
  } catch (error) {
    console.error("[forms] Failed to list form submissions.", error);
    return jsonError("LIST_FAILED", "Could not load form submissions.", 500);
  }
}
