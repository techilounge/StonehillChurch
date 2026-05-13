import { NextRequest, NextResponse } from "next/server";
import { requireAdminSessionForRequest } from "@/lib/api/adminSession";
import {
  CmsAdminError,
  archiveCmsDocument,
  deleteCmsDocument,
  getCmsDocument,
  isCmsModule,
  publishCmsDocument,
  updateCmsDocument,
} from "@/lib/data/adminCms";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ module: string; id: string }> };

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

function cmsError(error: unknown) {
  if (error instanceof CmsAdminError) {
    return jsonError(error.code, error.message, error.status, error.fieldErrors);
  }

  console.error("[admin/cms] Unexpected CMS error:", error);
  return jsonError("CMS_ERROR", "Could not complete CMS operation.", 500);
}

function normalizeUpdatePayload(body: unknown): { action?: string; data: unknown } {
  if (!body || typeof body !== "object") {
    return { data: body };
  }

  const record = body as Record<string, unknown>;
  return {
    action: typeof record.action === "string" ? record.action : undefined,
    data:
      record.data && typeof record.data === "object" && !Array.isArray(record.data)
        ? record.data
        : record,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireAdminSessionForRequest(_request, "admin:access");

  if (!auth.ok) {
    return jsonError(auth.reason, auth.message, auth.status);
  }

  const { module, id } = await context.params;

  if (!isCmsModule(module)) {
    return jsonError("UNKNOWN_CMS_MODULE", "Unknown CMS module.", 404);
  }

  try {
    const document = await getCmsDocument(module, id, auth.session);

    if (!document) {
      return jsonError("NOT_FOUND", "CMS document not found.", 404);
    }

    return NextResponse.json({ ok: true, data: { document } });
  } catch (error) {
    return cmsError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAdminSessionForRequest(request, "admin:access");

  if (!auth.ok) {
    return jsonError(auth.reason, auth.message, auth.status);
  }

  const { module, id } = await context.params;

  if (!isCmsModule(module)) {
    return jsonError("UNKNOWN_CMS_MODULE", "Unknown CMS module.", 404);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.");
  }

  const payload = normalizeUpdatePayload(body);

  try {
    const document =
      payload.action === "publish"
        ? await publishCmsDocument(module, id, auth.session)
        : payload.action === "archive"
          ? await archiveCmsDocument(module, id, auth.session)
          : await updateCmsDocument(module, id, payload.data, auth.session);

    return NextResponse.json({ ok: true, data: { document } });
  } catch (error) {
    return cmsError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAdminSessionForRequest(request, "admin:access");

  if (!auth.ok) {
    return jsonError(auth.reason, auth.message, auth.status);
  }

  const { module, id } = await context.params;

  if (!isCmsModule(module)) {
    return jsonError("UNKNOWN_CMS_MODULE", "Unknown CMS module.", 404);
  }

  try {
    const result = await deleteCmsDocument(module, id, auth.session, {
      hardDelete: request.nextUrl.searchParams.get("hard") === "true",
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return cmsError(error);
  }
}
