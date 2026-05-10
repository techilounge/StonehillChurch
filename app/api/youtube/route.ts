import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { requirePermission } from "@/lib/auth";
import { collections } from "@/lib/firestore";
import { getLatestYoutubeUploads } from "@/lib/data/youtubeVideos";
import {
  DEFAULT_YOUTUBE_SETTINGS,
  getYoutubeSettings,
  saveYoutubeSettings,
} from "@/lib/data/youtubeSettings";
import { getYouTubeChannelUrl, getYouTubeLiveUrl, isYouTubeApiConfigured } from "@/lib/youtube";
import type { YoutubeSettingsConfig } from "@/types/settings";

export async function GET() {
  const settings = await getYoutubeSettings();
  const latestVideos = await getLatestYoutubeUploads(settings, 6);

  return NextResponse.json({
    status: "ok",
    service: "youtube",
    apiConfigured: isYouTubeApiConfigured(),
    channelConfigured: Boolean(settings.channelId || settings.channelUrl),
    settings: {
      channelId: settings.channelId,
      channelUrl: getYouTubeChannelUrl(settings),
      liveStreamUrl: getYouTubeLiveUrl(settings),
      uploadsPlaylistId: settings.uploadsPlaylistId,
      featuredVideoId: settings.featuredVideoId,
      autoFetchLatestSermons: settings.autoFetchLatestSermons,
      showLiveBanner: settings.showLiveBanner,
    },
    latestVideos,
  });
}

function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim() || null;
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

  if (!validOptionalUrl(channelUrl)) {
    return { ok: false, message: "Channel URL must be a valid URL." };
  }

  if (!validOptionalUrl(liveStreamUrl)) {
    return { ok: false, message: "Livestream URL must be a valid URL." };
  }

  return {
    ok: true,
    settings: {
      ...DEFAULT_YOUTUBE_SETTINGS,
      channelId: clean(body.channelId),
      channelUrl,
      liveStreamUrl,
      uploadsPlaylistId: optionalString(body.uploadsPlaylistId),
      featuredVideoId: optionalString(body.featuredVideoId),
      autoFetchLatestSermons: body.autoFetchLatestSermons === true,
      showLiveBanner: body.showLiveBanner === true,
    },
  };
}

async function getYoutubeAdminSession(request: NextRequest) {
  const token = bearerToken(request);
  if (!token) {
    return null;
  }

  const decoded = await getAdminAuth().verifyIdToken(token);
  const profileSnapshot = await getAdminFirestore()
    .collection(collections.users)
    .doc(decoded.uid)
    .get();

  if (!profileSnapshot.exists) {
    return null;
  }

  const profile = profileSnapshot.data() ?? {};
  const authResult = requirePermission(
    {
      uid: decoded.uid,
      email: typeof profile.email === "string" ? profile.email : decoded.email ?? null,
      role: profile.role,
      approved: profile.approved === true,
      disabled: profile.disabled === true,
    },
    "youtube:manage",
  );

  return authResult.ok ? authResult.session : null;
}

export async function POST(request: NextRequest) {
  const session = await getYoutubeAdminSession(request);

  if (!session) {
    return NextResponse.json(
      { status: "error", message: "You are not authorized to manage YouTube settings." },
      { status: 403 },
    );
  }

  const parsed = parseSettingsPayload(await request.json());

  if (!parsed.ok) {
    return NextResponse.json({ status: "error", message: parsed.message }, { status: 400 });
  }

  await saveYoutubeSettings(parsed.settings, session.uid);

  return NextResponse.json({
    status: "ok",
    settings: parsed.settings,
  });
}
