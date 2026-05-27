import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/api/adminSession";
import {
  uploadMediaAsset,
  listMediaAssets,
  deleteMediaAssets,
  type DeleteMediaResult,
} from "@/lib/data/mediaAssets";
import type { Serialized } from "@/lib/data/utils";
import type { MediaAsset } from "@/types/media";

export type MediaListResponse =
  | { ok: true; data: { assets: Serialized<MediaAsset>[] } }
  | { ok: false; error: { message: string } };

export type MediaDeleteResponse =
  | { ok: true; data: DeleteMediaResult }
  | { ok: false; error: { message: string } };

const MAX_BULK_DELETE = 100;

export async function GET(req: NextRequest) {
  const auth = await getCurrentAdminSession("media:read");
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: { message: auth.message } }, { status: auth.status });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    
    const assets = await listMediaAssets({ limit });
    return NextResponse.json({ ok: true, data: { assets } });
  } catch (error: any) {
    console.error("[GET /api/admin/media] failed:", error);
    return NextResponse.json(
      { ok: false, error: { message: "Failed to load media assets." } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await getCurrentAdminSession("media:upload");
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: { message: auth.message } }, { status: auth.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const altText = formData.get("altText") as string | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: { message: "No file provided." } }, { status: 400 });
    }
    
    if (!altText || altText.trim() === "") {
      return NextResponse.json({ ok: false, error: { message: "Alt text is required." } }, { status: 400 });
    }

    const result = await uploadMediaAsset({ file, altText, actor: auth.session });
    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    console.error("[POST /api/admin/media] failed:", error);
    return NextResponse.json(
      { ok: false, error: { message: error.message || "Failed to upload media asset." } },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getCurrentAdminSession("media:manage");
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: { message: auth.message } }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { message: "Invalid JSON body." } },
      { status: 400 },
    );
  }

  const raw = (body as { ids?: unknown })?.ids;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json(
      { ok: false, error: { message: "Provide a non-empty 'ids' array." } },
      { status: 400 },
    );
  }

  if (raw.length > MAX_BULK_DELETE) {
    return NextResponse.json(
      { ok: false, error: { message: `Cannot delete more than ${MAX_BULK_DELETE} assets at once.` } },
      { status: 400 },
    );
  }

  const ids = raw.filter((v): v is string => typeof v === "string" && v.length > 0);
  if (ids.length === 0) {
    return NextResponse.json(
      { ok: false, error: { message: "No valid ids provided." } },
      { status: 400 },
    );
  }

  try {
    const result = await deleteMediaAssets(ids);
    return NextResponse.json({ ok: true, data: result });
  } catch (error: any) {
    console.error("[DELETE /api/admin/media] failed:", error);
    return NextResponse.json(
      { ok: false, error: { message: "Failed to delete media assets." } },
      { status: 500 },
    );
  }
}
