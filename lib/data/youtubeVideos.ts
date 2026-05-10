import "server-only";

import { getYouTubeThumbnailUrl, getYouTubeWatchUrl, type YouTubeVideo } from "@/lib/youtube";
import type { YoutubeSettingsConfig } from "@/types/settings";

const YOUTUBE_PLAYLIST_ITEMS_ENDPOINT = "https://www.googleapis.com/youtube/v3/playlistItems";
const CACHE_SECONDS = 60 * 30;

type YouTubeThumbnail = {
  url?: string;
};

type YouTubePlaylistItem = {
  snippet?: {
    title?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: {
      default?: YouTubeThumbnail;
      medium?: YouTubeThumbnail;
      high?: YouTubeThumbnail;
      standard?: YouTubeThumbnail;
      maxres?: YouTubeThumbnail;
    };
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
  settings: Pick<YoutubeSettingsConfig, "uploadsPlaylistId" | "autoFetchLatestSermons">,
  maxResults = 6,
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const playlistId = settings.uploadsPlaylistId?.trim();

  if (!apiKey || !playlistId || !settings.autoFetchLatestSermons) {
    return [];
  }

  const url = new URL(YOUTUBE_PLAYLIST_ITEMS_ENDPOINT);
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("playlistId", playlistId);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, { next: { revalidate: CACHE_SECONDS } });

  if (!response.ok) {
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
