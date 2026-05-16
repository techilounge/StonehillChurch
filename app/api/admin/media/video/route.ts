import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { uploadPopupVideo, PopupVideoUploadError } from "@/lib/data/popupVideos";

export type PopupVideoUploadResponse =
  | { ok: true; data: { url: string; storagePath: string; size: number } }
  | { ok: false; error: { message: string; code?: string } };

// Next 15 App Router: cap the multipart body for this route. The upstream
// pipeline rejects anything over 25 MB; this is a defense-in-depth bound on
// request parsing.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await getCurrentAdminSession("media:upload");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: { message: auth.message } },
      { status: auth.status },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (error) {
    console.error("[POST /api/admin/media/video] formData parse failed:", error);
    return NextResponse.json(
      { ok: false, error: { message: "Could not parse upload payload." } },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: { message: "No file provided." } },
      { status: 400 },
    );
  }

  try {
    const result = await uploadPopupVideo({ file, actor: auth.session });
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof PopupVideoUploadError) {
      return NextResponse.json(
        { ok: false, error: { message: error.message, code: error.code } },
        { status: error.status },
      );
    }
    console.error("[POST /api/admin/media/video] failed:", error);
    return NextResponse.json(
      { ok: false, error: { message: "Failed to upload video." } },
      { status: 500 },
    );
  }
}
