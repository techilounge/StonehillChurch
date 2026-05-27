import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { findMediaUsagesByIds, type MediaUsageMap } from "@/lib/data/mediaUsage";

export type MediaUsageResponse =
  | { ok: true; data: { usages: MediaUsageMap } }
  | { ok: false; error: { message: string } };

const MAX_USAGE_CHECK = 100;

export async function POST(req: NextRequest) {
  const auth = await getCurrentAdminSession("media:read");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: { message: auth.message } },
      { status: auth.status },
    );
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

  if (raw.length > MAX_USAGE_CHECK) {
    return NextResponse.json(
      { ok: false, error: { message: `Cannot check more than ${MAX_USAGE_CHECK} assets at once.` } },
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
    const usages = await findMediaUsagesByIds(ids);
    return NextResponse.json({ ok: true, data: { usages } });
  } catch (error: any) {
    console.error("[POST /api/admin/media/usage] failed:", error);
    return NextResponse.json(
      { ok: false, error: { message: "Failed to check media usage." } },
      { status: 500 },
    );
  }
}
