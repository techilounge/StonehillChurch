import type { MetadataRoute } from "next";
import { getPublishedEventsForSitemap } from "@/lib/data/events";
import { getMinistries } from "@/lib/data/ministries";
import { getSermons } from "@/lib/data/sermons";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { absoluteUrl, siteSettingsToSeoSettings, toIsoString } from "@/lib/seo";

type SitemapEntry = MetadataRoute.Sitemap[number];

const staticRoutes: Array<{
  path: string;
  changeFrequency: SitemapEntry["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/im-new", changeFrequency: "monthly", priority: 0.8 },
  { path: "/plan-your-visit", changeFrequency: "monthly", priority: 0.8 },
  { path: "/sermons", changeFrequency: "weekly", priority: 0.8 },
  { path: "/events", changeFrequency: "daily", priority: 0.8 },
  { path: "/ministries", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/our-beliefs", changeFrequency: "monthly", priority: 0.6 },
  { path: "/our-leaders", changeFrequency: "monthly", priority: 0.6 },
  { path: "/resources", changeFrequency: "weekly", priority: 0.6 },
  { path: "/church-bulletin", changeFrequency: "weekly", priority: 0.6 },
  { path: "/church-calendar", changeFrequency: "weekly", priority: 0.6 },
  { path: "/live", changeFrequency: "weekly", priority: 0.8 },
  { path: "/give", changeFrequency: "monthly", priority: 0.5 },
];

function sitemapEntry(
  siteUrl: string,
  path: string,
  changeFrequency: SitemapEntry["changeFrequency"],
  priority: number,
  lastModified?: unknown,
): SitemapEntry {
  const lastModifiedIso = toIsoString(lastModified);

  return {
    url: absoluteUrl(path, siteUrl),
    ...(lastModifiedIso ? { lastModified: lastModifiedIso } : {}),
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [siteSettings, sermons, events, ministries] = await Promise.all([
    getSiteSettings(),
    getSermons(),
    getPublishedEventsForSitemap(),
    getMinistries(),
  ]);
  const { siteUrl } = siteSettingsToSeoSettings(siteSettings);

  const entries = [
    ...staticRoutes.map((route) =>
      sitemapEntry(siteUrl, route.path, route.changeFrequency, route.priority),
    ),
    ...sermons.map((sermon) =>
      sitemapEntry(
        siteUrl,
        `/sermons/${sermon.slug}`,
        "monthly",
        0.6,
        sermon.updatedAt ?? sermon.sermonDate,
      ),
    ),
    ...events.map((event) =>
      sitemapEntry(
        siteUrl,
        `/events/${event.slug}`,
        "weekly",
        0.7,
        event.updatedAt ?? event.startDateTime,
      ),
    ),
    ...ministries.map((ministry) =>
      sitemapEntry(
        siteUrl,
        `/ministries/${ministry.slug}`,
        "monthly",
        0.6,
        ministry.updatedAt,
      ),
    ),
  ];

  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values());
}
