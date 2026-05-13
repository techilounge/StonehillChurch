import { NextRequest, NextResponse } from "next/server";
import { requireAdminSessionForRequest } from "@/lib/api/adminSession";
import {
  MediaUploadError,
  listMediaAssets,
  uploadMediaAsset,
} from "@/lib/data/mediaAssets";

export const runtime = "nodejs";

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

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function" &&
    "name" in value &&
    typeof (value as { name?: unknown }).name === "string" &&
    "type" in value &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdminSessionForRequest(request, "media:read");

  if (!authResult.ok) {
    return jsonError(authResult.reason, authResult.message, authResult.status);
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);

  try {
    const assets = await listMediaAssets({
      limit: Number.isFinite(limit) ? limit : 50,
    });

    return NextResponse.json({
      ok: true,
      data: { assets },
    });
  } catch (error) {
    console.error("[media GET] Failed to list media assets:", error);
    return jsonError("MEDIA_LIST_FAILED", "Could not load media assets.", 500);
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminSessionForRequest(request, "media:upload");

  if (!authResult.ok) {
    return jsonError(authResult.reason, authResult.message, authResult.status);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError("INVALID_FORM_DATA", "Request body must be multipart form data.");
  }

  const file = formData.get("file");
  const altText = String(formData.get("altText") ?? "");

  if (!isUploadFile(file)) {
    return jsonError("FILE_REQUIRED", "A WEBP, JPEG, or PNG file is required.", 400, {
      file: ["Upload an image file."],
    });
  }

  try {
    const result = await uploadMediaAsset({
      file,
      altText,
      actor: authResult.session,
    });

    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof MediaUploadError) {
      return jsonError(error.code, error.message, error.status);
    }

    console.error("[media POST] Upload failed:", error);
    return jsonError("MEDIA_UPLOAD_FAILED", "Could not upload media.", 500);
  }
}
