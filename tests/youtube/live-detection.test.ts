import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

import {
  _resetLiveCacheForTests,
  getLiveYoutubeBroadcast,
  parseYoutubeLiveHtml,
} from "@/lib/data/youtubeVideos";

function wrapPlayerResponse(payload: unknown, extraHtml = ""): string {
  return `<!doctype html><html><head><title>Stonehill Live - YouTube</title></head><body><script>var ytInitialPlayerResponse = ${JSON.stringify(payload)};</script>${extraHtml}</body></html>`;
}

describe("YouTube live broadcast parsing and fallback", () => {
  const originalApiKey = process.env.YOUTUBE_API_KEY;

  beforeEach(() => {
    process.env.YOUTUBE_API_KEY = "test-youtube-key";
    _resetLiveCacheForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    if (originalApiKey === undefined) {
      delete process.env.YOUTUBE_API_KEY;
    } else {
      process.env.YOUTUBE_API_KEY = originalApiKey;
    }
  });

  it("treats an offline channel browse page with historical watchEndpoint links as not live", () => {
    const html = `
      <!doctype html>
      <html>
        <head><link rel="canonical" href="https://www.youtube.com/channel/UC123" /></head>
        <body>
          <a href="/watch?v=PASTSERMON1">Past Sermon</a>
          <script>
            var ytInitialData = {"contents":{"watchEndpoint":{"videoId":"PASTSERMON1"}}};
          </script>
        </body>
      </html>
    `;

    expect(parseYoutubeLiveHtml(html)).toEqual({ ok: true, video: null });
  });

  it("treats an ended livestream VOD (isLiveContent=true, isLiveNow=false) as not live", () => {
    const html = wrapPlayerResponse({
      videoDetails: {
        videoId: "ENDEDVOD123",
        title: "Last Sabbath Worship",
        isLiveContent: true,
        isLive: false,
      },
      microformat: {
        playerMicroformatRenderer: {
          liveBroadcastDetails: {
            isLiveNow: false,
            startTimestamp: "2026-11-14T16:00:00Z",
            endTimestamp: "2026-11-14T18:00:00Z",
          },
        },
      },
    });

    expect(parseYoutubeLiveHtml(html)).toEqual({ ok: true, video: null });
  });

  it("treats scheduled upcoming streams as not live", () => {
    const html = wrapPlayerResponse({
      videoDetails: {
        videoId: "UPCOMESTRM1",
        title: "Next Sabbath",
        isUpcoming: true,
        isLive: false,
      },
      microformat: {
        playerMicroformatRenderer: {
          liveBroadcastDetails: {
            isLiveNow: false,
            startTimestamp: "2026-11-21T16:00:00Z",
          },
        },
      },
    });

    expect(parseYoutubeLiveHtml(html)).toEqual({ ok: true, video: null });
  });

  it("detects an active livestream and uses the CSP-allowed i.ytimg.com thumbnail host", () => {
    const html = wrapPlayerResponse({
      videoDetails: {
        videoId: "ACTIVELIVE1",
        title: "Divine Worship Live",
        shortDescription: "Join us today",
        isLive: true,
        isUpcoming: false,
      },
      microformat: {
        playerMicroformatRenderer: {
          liveBroadcastDetails: {
            isLiveNow: true,
            startTimestamp: "2026-11-14T17:00:00Z",
          },
        },
      },
    });

    const parsed = parseYoutubeLiveHtml(html);
    expect(parsed).toEqual({
      ok: true,
      video: {
        id: "ACTIVELIVE1",
        title: "Divine Worship Live",
        description: "Join us today",
        publishedAt: "2026-11-14T17:00:00Z",
        thumbnailUrl: "https://i.ytimg.com/vi/ACTIVELIVE1/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=ACTIVELIVE1",
      },
    });
  });

  it("treats YouTube consent or captcha walls as indeterminate", () => {
    expect(
      parseYoutubeLiveHtml('<html><form action="https://consent.youtube.com/save"></form></html>'),
    ).toEqual({ ok: false });
  });

  it("clears the live cache when quota fails and scraping confirms the stream ended", async () => {
    const fetchMock = vi
      .fn()
      // Call 1: YouTube Search API reports live broadcast
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                id: { videoId: "LIVEVID1234" },
                snippet: {
                  title: "Live Worship",
                  description: "Streaming now",
                  publishedAt: "2026-11-14T17:00:00Z",
                  thumbnails: { high: { url: "https://i.ytimg.com/vi/LIVEVID1234/hqdefault.jpg" } },
                },
              },
            ],
          }),
          { status: 200 },
        ),
      )
      // Call 2a: YouTube Search API hits 429 quotaExceeded
      .mockResolvedValueOnce(new Response("quotaExceeded", { status: 429 }))
      // Call 2b: Public /live scrape confirms channel browse page is offline
      .mockResolvedValueOnce(
        new Response(
          '<html><script>var ytInitialData = {"watchEndpoint":{"videoId":"LIVEVID1234"}};</script></html>',
          { status: 200 },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    const first = await getLiveYoutubeBroadcast({ channelId: "UCtest123" });
    expect(first?.id).toBe("LIVEVID1234");

    const second = await getLiveYoutubeBroadcast({ channelId: "UCtest123" });
    expect(second).toBeNull();
  });

  it("serves in-memory fallback only while within TTL when both API and scrape fail", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-14T17:00:00Z"));

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [{ id: { videoId: "LIVEVID1234" }, snippet: { title: "Live Worship" } }],
          }),
          { status: 200 },
        ),
      )
      // Within TTL: 429 + consent wall -> serve cached LIVEVID1234
      .mockResolvedValueOnce(new Response("quotaExceeded", { status: 429 }))
      .mockResolvedValueOnce(new Response('<a href="https://consent.youtube.com">', { status: 200 }))
      // After TTL (31 min): 429 + consent wall -> return null
      .mockResolvedValueOnce(new Response("quotaExceeded", { status: 429 }))
      .mockResolvedValueOnce(new Response('<a href="https://consent.youtube.com">', { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);

    expect((await getLiveYoutubeBroadcast({ channelId: "UCtest123" }))?.id).toBe("LIVEVID1234");

    vi.advanceTimersByTime(5 * 60 * 1000);
    expect((await getLiveYoutubeBroadcast({ channelId: "UCtest123" }))?.id).toBe("LIVEVID1234");

    vi.advanceTimersByTime(31 * 60 * 1000);
    expect(await getLiveYoutubeBroadcast({ channelId: "UCtest123" })).toBeNull();
  });
});

