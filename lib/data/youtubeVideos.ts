import "server-only";

import {
  getYouTubeThumbnailUrl,
  getYouTubeUploadsPlaylistId,
  getYouTubeWatchUrl,
  type YouTubeVideo,
} from "@/lib/youtube";
import type { YoutubeSettingsConfig } from "@/types/settings";
import { logDataFallback } from "./utils";

const YOUTUBE_PLAYLIST_ITEMS_ENDPOINT = "https://www.googleapis.com/youtube/v3/playlistItems";
const YOUTUBE_SEARCH_ENDPOINT = "https://www.googleapis.com/youtube/v3/search";
const UPLOADS_CACHE_SECONDS = 60 * 30;
const LIVE_CACHE_SECONDS = 60;

type YouTubeThumbnail = {
  url?: string;
};

type YouTubeThumbnails = {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
};

type YouTubePlaylistItem = {
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: YouTubeThumbnails;
    resourceId?: {
      videoId?: string;
    };
  };
  contentDetails?: {
    videoId?: string;
    videoPublishedAt?: string;
  };
};

type YouTubePlaylistResponse = {
  items?: YouTubePlaylistItem[];
  error?: {
    message?: string;
  };
};

type YouTubeSearchItem = {
  id?: {
    videoId?: string;
  };
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: YouTubeThumbnails;
  };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
  error?: {
    message?: string;
  };
};

function bestThumbnail(item: YouTubePlaylistItem, videoId: string): string {
  const thumbnails = item.snippet?.thumbnails;
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.standard?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    getYouTubeThumbnailUrl(videoId)
  );
}

export async function getLatestYoutubeUploads(
  settings: Pick<YoutubeSettingsConfig, "uploadsPlaylistId" | "channelId" | "autoFetchLatestSermons">,
  maxResults = 6,
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const playlistId = getYouTubeUploadsPlaylistId(settings);

  if (!apiKey || !playlistId || !settings.autoFetchLatestSermons) {
    return [];
  }

  const url = new URL(YOUTUBE_PLAYLIST_ITEMS_ENDPOINT);
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("playlistId", playlistId);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", apiKey);

  let response: Response;

  try {
    response = await fetch(url, { next: { revalidate: UPLOADS_CACHE_SECONDS } });
  } catch (error) {
    logDataFallback("getLatestYoutubeUploads", error);
    return [];
  }

  if (!response.ok) {
    logDataFallback(
      "getLatestYoutubeUploads",
      new Error(`YouTube API request failed with status ${response.status}.`),
    );
    return [];
  }

  const data = (await response.json()) as YouTubePlaylistResponse;

  if (!Array.isArray(data.items)) {
    return [];
  }

  return data.items
    .map((item): YouTubeVideo | null => {
      const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;

      if (!videoId) {
        return null;
      }

      return {
        id: videoId,
        title: item.snippet?.title ?? "Stonehill video",
        description: item.snippet?.description ?? "",
        publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt ?? null,
        thumbnailUrl: bestThumbnail(item, videoId),
        url: getYouTubeWatchUrl(videoId),
      };
    })
    .filter((video): video is YouTubeVideo => video !== null);
}

export async function getLiveYoutubeBroadcast(
  settings: Pick<YoutubeSettingsConfig, "channelId">,
): Promise<YouTubeVideo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = settings.channelId.trim();

  if (!apiKey || !channelId) {
    return null;
  }

  const url = new URL(YOUTUBE_SEARCH_ENDPOINT);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("eventType", "live");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "1");
  url.searchParams.set("key", apiKey);

  let response: Response;

  try {
    response = await fetch(url, { next: { revalidate: LIVE_CACHE_SECONDS } });
  } catch (error) {
    logDataFallback("getLiveYoutubeBroadcast", error);
    return null;
  }

  if (!response.ok) {
    logDataFallback(
      "getLiveYoutubeBroadcast",
      new Error(`YouTube live API request failed with status ${response.status}.`),
    );
    return null;
  }

  const data = (await response.json()) as YouTubeSearchResponse;
  const liveItem = Array.isArray(data.items) ? data.items[0] : null;
  const videoId = liveItem?.id?.videoId;

  if (!videoId) {
    return null;
  }

  return {
    id: videoId,
    title: liveItem?.snippet?.title ?? "Stonehill livestream",
    description: liveItem?.snippet?.description ?? "",
    publishedAt: liveItem?.snippet?.publishedAt ?? null,
    thumbnailUrl: bestThumbnail({ snippet: liveItem?.snippet }, videoId),
    url: getYouTubeWatchUrl(videoId),
  };
}
