import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { uploadMediaAsset, listMediaAssets } from "@/lib/data/mediaAssets";
import type { Serialized } from "@/lib/data/utils";
import type { MediaAsset } from "@/types/media";

export type MediaListResponse = 
  | { ok: true; data: { assets: Serialized<MediaAsset>[] } }
  | { ok: false; error: { message: string } };

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
