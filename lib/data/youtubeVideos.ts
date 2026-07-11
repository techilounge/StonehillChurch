import "server-only";

import { unstable_cache } from "next/cache";
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
const LIVE_CACHE_SECONDS = 300;

// In-memory fallback cache for live broadcast detection.
// When the YouTube Search API returns 429 (quota exceeded), we serve
// the last known successful result instead of flipping isLive to false.
// Bound to globalThis to survive Hot Module Reloading (HMR) / file recompilations.
const globalForYoutube = globalThis as unknown as {
  _liveBroadcastCache?: {
    video: YouTubeVideo | null;
    timestamp: number;
  };
};

function getLiveCache() {
  if (!globalForYoutube._liveBroadcastCache) {
    globalForYoutube._liveBroadcastCache = { video: null, timestamp: 0 };
  }
  return globalForYoutube._liveBroadcastCache;
}

function setLiveCache(video: YouTubeVideo | null) {
  globalForYoutube._liveBroadcastCache = { video, timestamp: Date.now() };
}

// How long (ms) the cached live result remains trustworthy. After this
// window we stop serving it and accept that we truly don't know.
const LIVE_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&quot;": '"',
    "&apos;": "'",
    "&#39;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
  };
  return text.replace(/&(amp|quot|apos|#39|lt|gt|nbsp);/g, (match) => entities[match] || match);
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
    const headers = { Referer: process.env.NEXT_PUBLIC_SITE_URL || "https://stonehillchurch.org" };
    response = await fetch(url, { headers, next: { revalidate: UPLOADS_CACHE_SECONDS } });
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
        title: decodeHtmlEntities(item.snippet?.title ?? "Stonehill video"),
        description: decodeHtmlEntities(item.snippet?.description ?? ""),
        publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt ?? null,
        thumbnailUrl: bestThumbnail(item, videoId),
        url: getYouTubeWatchUrl(videoId),
      };
    })
    .filter((video): video is YouTubeVideo => video !== null);
}

/**
 * Scrape the public YouTube channel live page to detect if a live stream is currently active.
 * This does not use any API quota and is a highly reliable fallback when the API returns 429.
 */
async function getLiveVideoByScraping(channelId: string): Promise<YouTubeVideo | null> {
  try {
    const url = `https://www.youtube.com/channel/${channelId}/live`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 60 } // Cache this check for 60 seconds
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    // Check if the page contains a watch URL
    if (!html.includes("watchEndpoint") && !html.includes("watch?v=")) {
      return null;
    }

    // Try to extract video ID from watchEndpoint JSON structure
    const match = html.match(/"watchEndpoint"\s*:\s*{\s*"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"/);
    let videoId = match ? match[1] : null;

    if (!videoId) {
      // Fallback: extract from watch?v= parameter in HTML
      const match2 = html.match(/\/watch\?v=([A-Za-z0-9_-]{11})/);
      videoId = match2 ? match2[1] : null;
    }

    if (!videoId) {
      return null;
    }

    // Try to extract title from <title> tag
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(" - YouTube", "") : "Stonehill Livestream";

    return {
      id: videoId,
      title,
      description: "Watch our live broadcast on YouTube.",
      publishedAt: new Date().toISOString(),
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (err) {
    console.warn("[getLiveVideoByScraping] Failed to scrape live page:", err);
    return null;
  }
}


/**
 * Serve the in-memory cached live broadcast result when the YouTube API
 * is unavailable (quota exhaustion, network error, etc.).
 */
function _serveLiveFallback(reason: string): YouTubeVideo | null {
  const cache = getLiveCache();
  const age = Date.now() - cache.timestamp;
  if (cache.video && age < LIVE_CACHE_TTL_MS) {
    console.warn(
      `[getLiveYoutubeBroadcast] Serving cached live result (age=${Math.round(age / 1000)}s) due to: ${reason}`
    );
    return cache.video;
  }
  console.warn(
    `[getLiveYoutubeBroadcast] No usable cache (age=${Math.round(age / 1000)}s) — returning null. Reason: ${reason}`
  );
  return null;
}

export async function getLiveYoutubeBroadcast(
  settings: Pick<YoutubeSettingsConfig, "channelId">,
): Promise<YouTubeVideo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = settings.channelId.trim();

  if (!apiKey || !channelId) {
    console.warn("[getLiveYoutubeBroadcast] Missing apiKey or channelId — skipping live check.");
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
    const headers = { Referer: process.env.NEXT_PUBLIC_SITE_URL || "https://stonehillchurch.org" };
    response = await fetch(url, { headers, next: { revalidate: LIVE_CACHE_SECONDS } });
  } catch (error) {
    logDataFallback("getLiveYoutubeBroadcast", error);
    // Try public scraping fallback first
    const scraped = await getLiveVideoByScraping(channelId);
    if (scraped) {
      console.log(`[getLiveYoutubeBroadcast] Resolved active live broadcast from scraping fallback: ${scraped.id}`);
      setLiveCache(scraped);
      return scraped;
    }
    return _serveLiveFallback("fetch error");
  }

  if (!response.ok) {
    // Log the response body — YouTube returns quota errors as JSON with
    // a descriptive reason field (e.g. "quotaExceeded").
    let body = "";
    try {
      body = await response.text();
    } catch { /* ignore */ }
    console.warn(
      `[getLiveYoutubeBroadcast] YouTube API responded ${response.status}: ${body.slice(0, 300)}`
    );
    logDataFallback(
      "getLiveYoutubeBroadcast",
      new Error(`YouTube live API request failed with status ${response.status}.`),
    );
    // Try public scraping fallback first
    const scraped = await getLiveVideoByScraping(channelId);
    if (scraped) {
      console.log(`[getLiveYoutubeBroadcast] Resolved active live broadcast from scraping fallback: ${scraped.id}`);
      setLiveCache(scraped);
      return scraped;
    }
    // On rate-limit / quota errors, serve the last known result
    return _serveLiveFallback(`HTTP ${response.status}`);
  }

  const data = (await response.json()) as YouTubeSearchResponse;
  const liveItem = Array.isArray(data.items) ? data.items[0] : null;
  const videoId = liveItem?.id?.videoId;

  if (!videoId) {
    console.log("[getLiveYoutubeBroadcast] YouTube API returned 200 but no live items found.");
    // Authoritative "not live" — clear the cache
    setLiveCache(null);
    return null;
  }

  console.log(`[getLiveYoutubeBroadcast] Live broadcast detected: ${videoId}`);

  const result: YouTubeVideo = {
    id: videoId,
    title: decodeHtmlEntities(liveItem?.snippet?.title ?? "Stonehill livestream"),
    description: decodeHtmlEntities(liveItem?.snippet?.description ?? ""),
    publishedAt: liveItem?.snippet?.publishedAt ?? null,
    thumbnailUrl: bestThumbnail({ snippet: liveItem?.snippet }, videoId),
    url: getYouTubeWatchUrl(videoId),
  };

  // Cache the successful result
  setLiveCache(result);

  return result;
}

/**
 * Deduplicated wrapper around `getLiveYoutubeBroadcast` that runs the actual
 * YouTube API call at most once every 5 minutes per channel across the entire
 * server process (regardless of how many client polls or concurrent visitors
 * ask for it). Keyed by `channelId` and tagged `youtube-live` so admin edits
 * to YouTube settings can invalidate on demand.
 *
 * YouTube `search.list` costs 100 quota units per call. With client polling
 * every 5 minutes AND this 5-minute server cache in place, a busy day still
 * spends only ~288 units regardless of visitor count.
 */
export const getCachedLiveYoutubeBroadcast = unstable_cache(
  async (settings: Pick<YoutubeSettingsConfig, "channelId">) => getLiveYoutubeBroadcast(settings),
  ["youtube-live-broadcast"],
  { revalidate: 300, tags: ["youtube-live", "youtube-settings"] },
);

export async function getYoutubeVideoById(videoId: string): Promise<YouTubeVideo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || !videoId) {
    return null;
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  let response: Response;

  try {
    const headers = { Referer: process.env.NEXT_PUBLIC_SITE_URL || "https://stonehillchurch.org" };
    response = await fetch(url, { headers, next: { revalidate: UPLOADS_CACHE_SECONDS } });
  } catch (error) {
    logDataFallback("getYoutubeVideoById", error);
    return null;
  }

  if (!response.ok) {
    logDataFallback(
      "getYoutubeVideoById",
      new Error(`YouTube video API request failed with status ${response.status}.`),
    );
    return null;
  }

  const data = (await response.json()) as YouTubeSearchResponse;
  const item = Array.isArray(data.items) ? data.items[0] : null;

  if (!item || !item.id) {
    return null;
  }

  // The videos endpoint returns the ID as a string, unlike the search endpoint which uses id.videoId
  const actualId = typeof item.id === "string" ? item.id : item.id.videoId;
  
  if (!actualId) return null;

  return {
    id: actualId,
    title: decodeHtmlEntities(item.snippet?.title ?? "Stonehill video"),
    description: decodeHtmlEntities(item.snippet?.description ?? ""),
    publishedAt: item.snippet?.publishedAt ?? null,
    thumbnailUrl: bestThumbnail({ snippet: item.snippet }, actualId),
    url: getYouTubeWatchUrl(actualId),
  };
}
