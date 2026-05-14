import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, Clock, ExternalLink, Radio, Youtube } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { SermonCard } from "@/components/public/SermonCard";
import { YouTubeLiteEmbed } from "@/components/public/YouTubeLiteEmbed";
import { buttonVariants } from "@/lib/buttonVariants";
import { getSermons } from "@/lib/data/sermons";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { getLatestYoutubeUploads, getLiveYoutubeBroadcast } from "@/lib/data/youtubeVideos";
import { getYoutubeSettings } from "@/lib/data/youtubeSettings";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import {
  extractYouTubeVideoId,
  getYouTubeChannelUrl,
  getYouTubeLiveUrl,
  getYouTubeThumbnailUrl,
} from "@/lib/youtube";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "live",
    title: "Watch Live",
    description: "Join our weekly worship services online via our live stream.",
    path: "/live",
  });
}

export const dynamic = "force-dynamic";

function serviceTimes(settings: Record<string, unknown>) {
  return [
    {
      label: "Breakfast Service",
      time: settings["service_times.breakfast_service"] || "Saturdays · 9:00am",
    },
    {
      label: "Sabbath School",
      time: settings["service_times.sabbath_school"] || "Saturdays · 10:00am",
    },
    {
      label: "Divine Worship",
      time:
        settings["service_times.divine_worship"] ||
        settings["service_times.worship_service"] ||
        "Saturdays · 11:00am",
    },
    {
      label: "Prayer Meeting",
      time: settings["service_times.prayer_meeting"] || "Wednesdays · 7:00pm",
    },
  ];
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function LiveStreamPage() {
  const [youtubeSettings, siteSettings, sermons] = await Promise.all([
    getYoutubeSettings(),
    getSiteSettings(),
    getSermons(),
  ]);

  const [latestYoutubeVideos, liveBroadcast] = await Promise.all([
    getLatestYoutubeUploads(youtubeSettings, 3),
    getLiveYoutubeBroadcast(youtubeSettings),
  ]);
  const channelUrl = getYouTubeChannelUrl(youtubeSettings);
  const liveUrl = getYouTubeLiveUrl(youtubeSettings);
  const configuredLiveVideoId = extractYouTubeVideoId(youtubeSettings.liveStreamUrl);
  const featuredVideoId = extractYouTubeVideoId(youtubeSettings.featuredVideoId);
  const liveVideoId =
    configuredLiveVideoId ??
    liveBroadcast?.id ??
    (youtubeSettings.liveStreamUrl ? null : featuredVideoId);
  const liveVideoTitle =
    liveBroadcast?.id === liveVideoId
      ? liveBroadcast.title
      : "Stonehill SDA Church livestream";
  const liveThumbnailUrl =
    liveBroadcast?.id === liveVideoId
      ? liveBroadcast.thumbnailUrl
      : liveVideoId
        ? getYouTubeThumbnailUrl(liveVideoId)
        : null;
  const hasConfiguredChannel = Boolean(youtubeSettings.channelId || youtubeSettings.channelUrl);
  const times = serviceTimes(siteSettings);

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 pb-20">
      <PageHero
        title="Watch Live"
        subtitle="Join worship online, then stay connected with recent messages."
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]",
                    youtubeSettings.showLiveBanner
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-50 text-stonehill-dark",
                  )}
                >
                  <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                  {youtubeSettings.showLiveBanner ? "Live Stream" : "Online Worship"}
                </span>
                <h2 className="text-xl font-semibold text-stonehill-primary">
                  Stonehill SDA Church Worship
                </h2>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {liveVideoId ? (
                <YouTubeLiteEmbed
                  videoId={liveVideoId}
                  title={liveVideoTitle}
                  thumbnailUrl={liveThumbnailUrl}
                  className="shadow-inner"
                  buttonLabel={`Play ${liveVideoTitle}`}
                />
              ) : (
                <div className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                  <Youtube className="h-14 w-14 text-stonehill-dark/50" aria-hidden="true" />
                  <h2 className="mt-5 text-2xl font-semibold text-stonehill-primary">
                    Livestream Opens on YouTube
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-900/75">
                    When a specific live video is configured, it will play here. You can always
                    continue to the church channel for live and recent services.
                  </p>
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ size: "lg" }), "mt-6")}
                  >
                    Open Livestream
                    <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ size: "lg" }))}
                >
                  Watch on YouTube
                  <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href={channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  {hasConfiguredChannel ? "Open Church Channel" : "Open YouTube"}
                  <Youtube className="ml-2 h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 text-stonehill-primary">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
              <h2 className="text-lg font-semibold">Service Times</h2>
            </div>
            <div className="mt-5 space-y-4">
              {times.map((item) => (
                <div key={item.label} className="rounded-md bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-slate-900/75">
                    <Clock className="h-4 w-4 text-stonehill-accent" aria-hidden="true" />
                    {String(item.time)}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-900/70">
              The livestream is available for worship services when the church is broadcasting.
              Past messages remain available through the sermon library and YouTube channel.
            </p>
          </aside>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stonehill-dark">
                Recent Messages
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-stonehill-primary">
                Latest Videos and Sermons
              </h2>
            </div>
            <Link href="/sermons" className={cn(buttonVariants({ variant: "outline" }))}>
              Browse Sermons
            </Link>
          </div>

          {latestYoutubeVideos.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {latestYoutubeVideos.map((video) => {
                const date = formatDate(video.publishedAt);

                return (
                  <article
                    key={video.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <YouTubeLiteEmbed
                      videoId={video.id}
                      title={video.title}
                      thumbnailUrl={video.thumbnailUrl}
                      className="rounded-none"
                    />
                    <div className="p-5">
                      {date && (
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stonehill-dark">
                          {date}
                        </p>
                      )}
                      <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-slate-900">
                        {video.title}
                      </h3>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center text-sm font-semibold text-stonehill-primary hover:text-stonehill-dark"
                      >
                        Open on YouTube
                        <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : sermons.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sermons.slice(0, 3).map((sermon) => (
                <SermonCard key={sermon.id} sermon={sermon} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-900/70">
              Recent sermons will appear here once they are published.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
