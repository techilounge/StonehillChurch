import { NextRequest, NextResponse } from "next/server";
import { requireAdminSessionForRequest } from "@/lib/api/adminSession";
import {
  CmsAdminError,
  createCmsDocument,
  isCmsModule,
  listCmsDocuments,
} from "@/lib/data/adminCms";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ module: string }> };

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

function normalizeCreatePayload(body: unknown): { id?: string; data: unknown } {
  if (!body || typeof body !== "object") {
    return { data: body };
  }

  const record = body as Record<string, unknown>;
  return {
    id: typeof record.id === "string" ? record.id : undefined,
    data:
      record.data && typeof record.data === "object" && !Array.isArray(record.data)
        ? record.data
        : record,
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAdminSessionForRequest(request, "admin:access");

  if (!auth.ok) {
    return jsonError(auth.reason, auth.message, auth.status);
  }

  const { module } = await context.params;

  if (!isCmsModule(module)) {
    return jsonError("UNKNOWN_CMS_MODULE", "Unknown CMS module.", 404);
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
  const status = request.nextUrl.searchParams.get("status") ?? undefined;

  try {
    const documents = await listCmsDocuments(module, auth.session, {
      status,
      limit: Number.isFinite(limit) ? limit : 50,
    });

    return NextResponse.json({ ok: true, data: { documents } });
  } catch (error) {
    return cmsError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAdminSessionForRequest(request, "admin:access");

  if (!auth.ok) {
    return jsonError(auth.reason, auth.message, auth.status);
  }

  const { module } = await context.params;

  if (!isCmsModule(module)) {
    return jsonError("UNKNOWN_CMS_MODULE", "Unknown CMS module.", 404);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_JSON", "Request body must be valid JSON.");
  }

  const payload = normalizeCreatePayload(body);

  try {
    const document = await createCmsDocument(module, payload.data, auth.session, {
      id: payload.id,
    });

    return NextResponse.json({ ok: true, data: { document } }, { status: 201 });
  } catch (error) {
    return cmsError(error);
  }
}
