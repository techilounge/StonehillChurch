import { NextResponse } from "next/server";
import { getYouTubeConfig } from "@/lib/youtube";

export async function GET() {
  const config = getYouTubeConfig();

  return NextResponse.json({
    status: "ok",
    service: "youtube",
    channelConfigured: Boolean(config.channelId),
  });
}
