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

/** Reset in-memory live broadcast fallback cache (for unit tests). */
export function _resetLiveCacheForTests() {
  globalForYoutube._liveBroadcastCache = undefined;
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

export type LiveScrapeResult =
  | { ok: true; video: YouTubeVideo | null }
  | { ok: false };

type ParsedInitialPlayerResponse = {
  videoDetails?: {
    videoId?: unknown;
    title?: unknown;
    shortDescription?: unknown;
    isLive?: unknown;
    isUpcoming?: unknown;
  };
  microformat?: {
    playerMicroformatRenderer?: {
      liveBroadcastDetails?: {
        isLiveNow?: unknown;
        startTimestamp?: unknown;
        endTimestamp?: unknown;
      };
    };
  };
};

/**
 * Extract and parse a balanced JSON object literal starting after a given index.
 */
function extractJsonObjectAfter(source: string, searchFromIndex: number): unknown {
  let openIndex = searchFromIndex;
  while (openIndex < source.length && /\s/.test(source[openIndex])) {
    openIndex += 1;
  }
  if (source[openIndex] !== "{") {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(source.slice(openIndex, i + 1));
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

function extractTitleTag(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch) return null;
  const cleaned = decodeHtmlEntities(titleMatch[1].replace(/\s*-\s*YouTube\s*$/i, "").trim());
  return cleaned || null;
}

/**
 * Parse a YouTube `/channel/<id>/live` HTML response to determine whether a stream
 * is actively live (`video`), authoritatively offline (`video: null`), or
 * blocked/indeterminate (`ok: false`).
 */
export function parseYoutubeLiveHtml(html: string): LiveScrapeResult {
  if (!html) {
    return { ok: false };
  }

  // Consent walls, CAPTCHAs, or bot challenges give no trustworthy channel state.
  if (
    html.includes("consent.youtube.com") ||
    html.includes("g-recaptcha") ||
    html.includes("unusual traffic")
  ) {
    return { ok: false };
  }

  const playerMarker = html.match(
    /(?:var\s+ytInitialPlayerResponse|window\[["']ytInitialPlayerResponse["']\]|\bytInitialPlayerResponse)\s*=\s*/,
  );

  if (playerMarker && playerMarker.index !== undefined) {
    const parsed = extractJsonObjectAfter(
      html,
      playerMarker.index + playerMarker[0].length,
    ) as ParsedInitialPlayerResponse | null;

    if (parsed && typeof parsed === "object") {
      const videoDetails = parsed.videoDetails;
      const broadcast = parsed.microformat?.playerMicroformatRenderer?.liveBroadcastDetails;
      const rawVideoId = typeof videoDetails?.videoId === "string" ? videoDetails.videoId : "";
      const isValidVideoId = /^[A-Za-z0-9_-]{11}$/.test(rawVideoId);

      const isUpcoming = videoDetails?.isUpcoming === true;
      const isLiveNow = broadcast?.isLiveNow;
      const hasEnded =
        (typeof broadcast?.endTimestamp === "string" && broadcast.endTimestamp.length > 0) ||
        isLiveNow === false;
      const isCurrentlyLive =
        isValidVideoId &&
        !isUpcoming &&
        !hasEnded &&
        (isLiveNow === true || videoDetails?.isLive === true);

      if (!isCurrentlyLive) {
        return { ok: true, video: null };
      }

      const title =
        (typeof videoDetails?.title === "string" && videoDetails.title.trim()) ||
        extractTitleTag(html) ||
        "Stonehill Livestream";
      const description =
        typeof videoDetails?.shortDescription === "string" && videoDetails.shortDescription.trim()
          ? videoDetails.shortDescription
          : "Watch our live broadcast on YouTube.";
      const publishedAt =
        typeof broadcast?.startTimestamp === "string" && broadcast.startTimestamp
          ? broadcast.startTimestamp
          : new Date().toISOString();

      return {
        ok: true,
        video: {
          id: rawVideoId,
          title,
          description,
          publishedAt,
          thumbnailUrl: getYouTubeThumbnailUrl(rawVideoId),
          url: getYouTubeWatchUrl(rawVideoId),
        },
      };
    }
  }

  // Offline `/channel/<id>/live` redirects/renders a channel browse shell with
  // `ytInitialData` (containing historical `watchEndpoint` links) and no active player.
  if (
    html.includes("ytInitialData") ||
    html.includes("youtube.com/channel/") ||
    html.includes("youtube.com/@")
  ) {
    return { ok: true, video: null };
  }

  return { ok: false };
}

/**
 * Scrape the public YouTube channel live page to detect if a live stream is currently active.
 * This does not use any API quota when the YouTube Data API fails or exhausts quota.
 */
async function getLiveVideoByScraping(channelId: string): Promise<LiveScrapeResult> {
  try {
    const url = `https://www.youtube.com/channel/${channelId}/live`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return { ok: false };
    }

    const html = await response.text();
    return parseYoutubeLiveHtml(html);
  } catch (err) {
    console.warn("[getLiveVideoByScraping] Failed to scrape live page:", err);
    return { ok: false };
  }
}

/**
 * Serve the in-memory cached live broadcast result when the YouTube API
 * and public scrape fallback are unavailable.
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

async function resolveLiveBroadcastFallback(
  channelId: string,
  reason: string,
): Promise<YouTubeVideo | null> {
  const scraped = await getLiveVideoByScraping(channelId);
  if (scraped.ok) {
    setLiveCache(scraped.video);
    if (scraped.video) {
      console.log(
        `[getLiveYoutubeBroadcast] Resolved active live broadcast from scraping fallback: ${scraped.video.id}`,
      );
    } else {
      console.log("[getLiveYoutubeBroadcast] Scraping confirmed channel is offline — cleared live cache.");
    }
    return scraped.video;
  }

  return _serveLiveFallback(reason);
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
    return resolveLiveBroadcastFallback(channelId, "fetch error");
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
    return resolveLiveBroadcastFallback(channelId, `HTTP ${response.status}`);
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
