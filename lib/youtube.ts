import type { YoutubeSettingsConfig } from "@/types/settings";

export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string | null;
  thumbnailUrl: string;
  url: string;
};

const VIDEO_ID_PATTERN = /^[0-9A-Za-z_-]{11}$/;

function clean(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function extractYouTubeVideoId(value: string | null | undefined): string | null {
  const input = clean(value);

  if (!input) {
    return null;
  }

  if (VIDEO_ID_PATTERN.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const [id] = url.pathname.split("/").filter(Boolean);
      return VIDEO_ID_PATTERN.test(id) ? id : null;
    }

    if (hostname === "youtube.com" || hostname === "youtube-nocookie.com" || hostname.endsWith(".youtube.com")) {
      const watchId = url.searchParams.get("v");
      if (watchId && VIDEO_ID_PATTERN.test(watchId)) {
        return watchId;
      }

      const segments = url.pathname.split("/").filter(Boolean);
      const videoIndex = segments.findIndex((segment) =>
        ["embed", "shorts", "live"].includes(segment),
      );
      const id = videoIndex >= 0 ? segments[videoIndex + 1] : null;
      return id && VIDEO_ID_PATTERN.test(id) ? id : null;
    }
  } catch {
    const match = input.match(
      /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/))([0-9A-Za-z_-]{11})/,
    );
    return match?.[1] ?? null;
  }

  return null;
}

export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeUploadsPlaylistId(
  settings: Pick<YoutubeSettingsConfig, "uploadsPlaylistId" | "channelId">,
): string | null {
  const configuredPlaylistId = clean(settings.uploadsPlaylistId);
  if (configuredPlaylistId) {
    return configuredPlaylistId;
  }

  const channelId = clean(settings.channelId);
  if (channelId.startsWith("UC") && channelId.length > 2) {
    return `UU${channelId.slice(2)}`;
  }

  return null;
}

export function getYouTubeChannelUrl(settings: Pick<YoutubeSettingsConfig, "channelId" | "channelUrl">): string {
  const configuredUrl = clean(settings.channelUrl);
  if (configuredUrl) {
    return configuredUrl;
  }

  const channelId = clean(settings.channelId);
  if (channelId) {
    return `https://www.youtube.com/channel/${channelId}`;
  }

  return "https://www.youtube.com";
}

export function getYouTubeLiveUrl(
  settings: Pick<YoutubeSettingsConfig, "channelId" | "channelUrl" | "liveStreamUrl">,
): string {
  const configuredLiveUrl = clean(settings.liveStreamUrl);
  if (configuredLiveUrl) {
    return configuredLiveUrl;
  }

  const channelUrl = clean(settings.channelUrl);
  if (channelUrl) {
    return `${channelUrl.replace(/\/$/, "")}/live`;
  }

  const channelId = clean(settings.channelId);
  if (channelId) {
    return `https://www.youtube.com/channel/${channelId}/live`;
  }

  return getYouTubeChannelUrl(settings);
}
