import { NextRequest, NextResponse } from "next/server";
import { requireAdminSessionForRequest } from "@/lib/api/adminSession";
import { getLatestYoutubeUploads, getLiveYoutubeBroadcast } from "@/lib/data/youtubeVideos";
import {
  DEFAULT_YOUTUBE_SETTINGS,
  getYoutubeSettings,
  saveYoutubeSettings,
} from "@/lib/data/youtubeSettings";
import {
  extractYouTubeVideoId,
  getYouTubeChannelUrl,
  getYouTubeLiveUrl,
  getYouTubeUploadsPlaylistId,
} from "@/lib/youtube";
import { isYouTubeApiConfigured } from "@/lib/youtubeServer";
import type { YoutubeSettingsConfig } from "@/types/settings";

export async function GET(request: NextRequest) {
  const authResult = await requireAdminSessionForRequest(request, "admin:access");

  if (!authResult.ok) {
    return NextResponse.json(
      { status: "error", code: authResult.reason, message: authResult.message },
      { status: authResult.status },
    );
  }

  const settings = await getYoutubeSettings();
  const [latestVideos, liveBroadcast] = await Promise.all([
    getLatestYoutubeUploads(settings, 6),
    getLiveYoutubeBroadcast(settings),
  ]);

  return NextResponse.json({
    status: "ok",
    service: "youtube",
    apiConfigured: isYouTubeApiConfigured(),
    channelConfigured: Boolean(settings.channelId || settings.channelUrl),
    settings: {
      channelId: settings.channelId,
      channelUrl: getYouTubeChannelUrl(settings),
      liveStreamUrl: getYouTubeLiveUrl(settings),
      uploadsPlaylistId: getYouTubeUploadsPlaylistId(settings),
      featuredVideoId: settings.featuredVideoId,
      autoFetchLatestSermons: settings.autoFetchLatestSermons,
      showLiveBanner: settings.showLiveBanner,
    },
    liveBroadcast,
    latestVideos,
  });
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value: unknown): string | null {
  const cleaned = clean(value);
  return cleaned ? cleaned : null;
}

function validOptionalUrl(value: string | null): boolean {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function optionalVideoId(value: unknown): { ok: true; value: string | null } | { ok: false; message: string } {
  const cleaned = optionalString(value);

  if (!cleaned) {
    return { ok: true, value: null };
  }

  const videoId = extractYouTubeVideoId(cleaned);

  if (!videoId) {
    return {
      ok: false,
      message: "Featured video must be an 11-character YouTube video ID or a valid YouTube video URL.",
    };
  }

  return { ok: true, value: videoId };
}

function parseSettingsPayload(payload: unknown): {
  ok: true;
  settings: YoutubeSettingsConfig;
} | {
  ok: false;
  message: string;
} {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Invalid YouTube settings payload." };
  }

  const body = payload as Record<string, unknown>;
  const channelUrl = clean(body.channelUrl);
  const liveStreamUrl = optionalString(body.liveStreamUrl);
  const featuredVideoId = optionalVideoId(body.featuredVideoId);

  if (!validOptionalUrl(channelUrl)) {
    return { ok: false, message: "Channel URL must be a valid URL." };
  }

  if (!validOptionalUrl(liveStreamUrl)) {
    return { ok: false, message: "Livestream URL must be a valid URL." };
  }

  if (!featuredVideoId.ok) {
    return { ok: false, message: featuredVideoId.message };
  }

  return {
    ok: true,
    settings: {
      ...DEFAULT_YOUTUBE_SETTINGS,
      channelId: clean(body.channelId),
      channelUrl,
      liveStreamUrl,
      uploadsPlaylistId: optionalString(body.uploadsPlaylistId),
      featuredVideoId: featuredVideoId.value,
      autoFetchLatestSermons: body.autoFetchLatestSermons === true,
      showLiveBanner: body.showLiveBanner === true,
    },
  };
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminSessionForRequest(request, "youtube:manage");

  if (!authResult.ok) {
    return NextResponse.json(
      { status: "error", code: authResult.reason, message: authResult.message },
      { status: authResult.status },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = parseSettingsPayload(body);

  if (!parsed.ok) {
    return NextResponse.json({ status: "error", message: parsed.message }, { status: 400 });
  }

  await saveYoutubeSettings(parsed.settings, authResult.session.uid);

  return NextResponse.json({
    status: "ok",
    settings: parsed.settings,
  });
}
