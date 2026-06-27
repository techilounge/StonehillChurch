import { NextResponse } from "next/server";
import { getLatestSermon } from "@/lib/data/sermons";
import { getYoutubeSettings } from "@/lib/data/youtubeSettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [latestSermon, youtubeSettings] = await Promise.all([
      getLatestSermon(),
      getYoutubeSettings(),
    ]);

    const isLive = !!latestSermon?.isLive || !!youtubeSettings.showLiveBanner;

    return NextResponse.json({
      status: "ok",
      isLive,
    });
  } catch (error) {
    console.error("[LiveStatus API] Error checking status:", error);
    return NextResponse.json(
      { status: "error", message: "Failed to determine live status" },
      { status: 500 }
    );
  }
}
