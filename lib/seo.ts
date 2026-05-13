import "server-only";

import type { Metadata } from "next";
import type { ChurchEvent, Ministry, PageContent, Sermon } from "@/types/content";

export const DEFAULT_SITE_NAME = "Stonehill Seventh-day Adventist Church";
export const DEFAULT_SITE_DESCRIPTION =
  "A welcoming Seventh-day Adventist church community.";
export const DEFAULT_SITE_URL = "https://stonehillsda.org";

export type SiteSeoSettings = {
  siteName: string;
  description: string;
  siteUrl: string;
  defaultImage?: string;
  twitterHandle?: string;
  email?: string;
  phone?: string;
  address?: string;
  addressStreet?: string;
  addressCity?: string;
  addressRegion?: string;
  addressPostalCode?: string;
  addressCountry?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
};

type SeoConfig = {
  title: string | { absolute: string };
  description?: string | null;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  settings?: Partial<SiteSeoSettings>;
  noIndex?: boolean;
  noIndexFollow?: boolean;
};

type SeoPageContent = Partial<PageContent>;
type SeoSermon = Pick<Sermon, "slug" | "title"> & Partial<Sermon>;
type SeoEvent = Pick<ChurchEvent, "slug" | "title"> & Partial<ChurchEvent>;
type SeoMinistry = Pick<Ministry, "slug" | "name"> & Partial<Ministry>;

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue | undefined };

export type JsonLd = { [key: string]: JsonLdValue | undefined };

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function siteSettingsToSeoSettings(
  settings: Record<string, unknown> = {},
): SiteSeoSettings {
  const siteUrl =
    cleanString(settings["seo.siteUrl"]) ??
    cleanString(settings["general.siteUrl"]) ??
    cleanString(settings.siteUrl) ??
    cleanString(process.env.NEXT_PUBLIC_SITE_URL) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
    DEFAULT_SITE_URL;

  return {
    siteName:
      cleanString(settings["seo.siteName"]) ??
      cleanString(settings["general.churchName"]) ??
      cleanString(settings.siteName) ??
      DEFAULT_SITE_NAME,
    description:
      cleanString(settings["seo.description"]) ??
      cleanString(settings["seo.defaultDescription"]) ??
      cleanString(settings["general.tagline"]) ??
      cleanString(settings.description) ??
      DEFAULT_SITE_DESCRIPTION,
    siteUrl: normalizeSiteUrl(siteUrl),
    defaultImage: cleanString(settings["seo.defaultImage"]) ?? cleanString(settings.defaultImage),
    twitterHandle: cleanString(settings["seo.twitterHandle"]) ?? cleanString(settings.twitterHandle),
    email: cleanString(settings["contact.email"]) ?? cleanString(settings.email),
    phone: cleanString(settings["contact.phone"]) ?? cleanString(settings.phone),
    address: cleanString(settings["contact.address"]) ?? cleanString(settings.address),
    addressStreet: cleanString(settings["seo.address.street"]),
    addressCity: cleanString(settings["seo.address.city"]),
    addressRegion: cleanString(settings["seo.address.region"]),
    addressPostalCode: cleanString(settings["seo.address.postalCode"]),
    addressCountry: cleanString(settings["seo.address.country"]),
    youtubeUrl: cleanString(settings["social.youtube"]) ?? cleanString(settings.youtubeUrl),
    facebookUrl: cleanString(settings["social.facebook"]) ?? cleanString(settings.facebookUrl),
    instagramUrl: cleanString(settings["social.instagram"]) ?? cleanString(settings.instagramUrl),
  };
}

export function normalizeSiteUrl(siteUrl = DEFAULT_SITE_URL): string {
  const trimmed = siteUrl.trim().replace(/\/+$/, "");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function absoluteUrl(path = "/", siteUrl = DEFAULT_SITE_URL): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizeSiteUrl(siteUrl)}${normalizedPath}`;
}

export function toIsoString(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === "object" && value && "toDate" in value) {
    const timestamp = value as { toDate?: () => Date };
    if (typeof timestamp.toDate === "function") {
      return toIsoString(timestamp.toDate());
    }
  }

  return null;
}

function truncateDescription(value: string | null | undefined, fallback: string): string {
  const text = cleanString(value) ?? fallback;
  return text.length > 160 ? `${text.slice(0, 157).trim()}...` : text;
}

export function createMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  settings,
  noIndex = false,
  noIndexFollow = false,
}: SeoConfig): Metadata {
  const site = {
    siteName: settings?.siteName ?? DEFAULT_SITE_NAME,
    description: settings?.description ?? DEFAULT_SITE_DESCRIPTION,
    siteUrl: normalizeSiteUrl(settings?.siteUrl ?? DEFAULT_SITE_URL),
    defaultImage: settings?.defaultImage,
    twitterHandle: settings?.twitterHandle,
  };
  const titleText = typeof title === "string" ? title : title.absolute;
  const canonical = absoluteUrl(path, site.siteUrl);
  const metadataDescription = truncateDescription(description, site.description);
  const imageUrl = image || site.defaultImage;
  const absoluteImage = imageUrl ? absoluteUrl(imageUrl, site.siteUrl) : undefined;

  const openGraphBase = {
    title: titleText,
    description: metadataDescription,
    url: canonical,
    siteName: site.siteName,
    ...(absoluteImage ? { images: [{ url: absoluteImage, alt: titleText }] } : {}),
  };

  return {
    title,
    description: metadataDescription,
    metadataBase: new URL(site.siteUrl),
    alternates: {
      canonical,
    },
    openGraph:
      type === "article"
        ? {
            ...openGraphBase,
            type: "article",
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
          }
        : {
            ...openGraphBase,
            type: "website",
          },
    twitter: {
      card: absoluteImage ? "summary_large_image" : "summary",
      title: titleText,
      site: site.twitterHandle,
      description: metadataDescription,
      ...(absoluteImage ? { images: [absoluteImage] } : {}),
    },
    robots: noIndexFollow
      ? { index: false, follow: true }
      : noIndex
        ? { index: false, follow: false }
        : undefined,
  };
}

export function createPageMetadata(
  page: SeoPageContent | null,
  fallback: SeoConfig,
): Metadata {
  return createMetadata({
    ...fallback,
    title: page?.seoTitle || page?.title || fallback.title,
    description: page?.seoDescription || fallback.description,
    modifiedTime: toIsoString(page?.updatedAt),
  });
}

export function createSermonMetadata(
  sermon: SeoSermon,
  settings?: Partial<SiteSeoSettings>,
): Metadata {
  return createMetadata({
    title: sermon.seoTitle || sermon.title,
    description: sermon.seoDescription || sermon.description,
    path: `/sermons/${sermon.slug}`,
    image: sermon.thumbnailUrl,
    type: "article",
    publishedTime: toIsoString(sermon.sermonDate),
    modifiedTime: toIsoString(sermon.updatedAt),
    settings,
  });
}

export function createEventMetadata(
  event: SeoEvent,
  settings?: Partial<SiteSeoSettings>,
): Metadata {
  return createMetadata({
    title: event.seoTitle || event.title,
    description: event.seoDescription || event.description,
    path: `/events/${event.slug}`,
    image: event.imageUrl,
    type: "article",
    publishedTime: toIsoString(event.startDateTime),
    modifiedTime: toIsoString(event.updatedAt),
    settings,
  });
}

export function createMinistryMetadata(
  ministry: SeoMinistry,
  settings?: Partial<SiteSeoSettings>,
): Metadata {
  return createMetadata({
    title: ministry.seoTitle || ministry.name,
    description: ministry.seoDescription || ministry.shortDescription,
    path: `/ministries/${ministry.slug}`,
    image: ministry.imageUrl,
    type: "article",
    modifiedTime: toIsoString(ministry.updatedAt),
    settings,
  });
}

function postalAddressJsonLd(settings: SiteSeoSettings): JsonLd | undefined {
  if (
    settings.addressStreet ||
    settings.addressCity ||
    settings.addressRegion ||
    settings.addressPostalCode ||
    settings.addressCountry
  ) {
    return {
      "@type": "PostalAddress",
      streetAddress: settings.addressStreet,
      addressLocality: settings.addressCity,
      addressRegion: settings.addressRegion,
      postalCode: settings.addressPostalCode,
      addressCountry: settings.addressCountry,
    };
  }

  if (settings.address) {
    return {
      "@type": "PostalAddress",
      streetAddress: settings.address,
    };
  }

  return undefined;
}

export function organizationJsonLd(settings: SiteSeoSettings): JsonLd {
  const sameAs = [
    settings.youtubeUrl,
    settings.facebookUrl,
    settings.instagramUrl,
  ].filter(Boolean) as string[];

  return {
    "@context": "https://schema.org",
    "@type": "ReligiousOrganization",
    name: settings.siteName,
    url: settings.siteUrl,
    description: settings.description,
    email: settings.email,
    telephone: settings.phone,
    address: postalAddressJsonLd(settings),
    sameAs,
  };
}

export function placeJsonLd(settings: SiteSeoSettings): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: settings.siteName,
    url: settings.siteUrl,
    address: postalAddressJsonLd(settings),
    telephone: settings.phone,
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
  siteUrl: string,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, siteUrl),
    })),
  };
}

export function eventJsonLd(event: SeoEvent, siteUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.seoDescription || event.description,
    url: absoluteUrl(`/events/${event.slug}`, siteUrl),
    startDate: toIsoString(event.startDateTime),
    endDate: toIsoString(event.endDateTime),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: event.location
      ? {
          "@type": "Place",
          name: event.location,
        }
      : undefined,
    image: event.imageUrl ? [absoluteUrl(event.imageUrl, siteUrl)] : undefined,
  };
}

export function videoObjectJsonLd(sermon: SeoSermon, siteUrl: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: sermon.title,
    description: sermon.seoDescription || sermon.description,
    thumbnailUrl: sermon.thumbnailUrl ? [absoluteUrl(sermon.thumbnailUrl, siteUrl)] : undefined,
    uploadDate: toIsoString(sermon.sermonDate ?? sermon.updatedAt ?? sermon.createdAt),
    embedUrl: sermon.youtubeVideoId
      ? `https://www.youtube-nocookie.com/embed/${sermon.youtubeVideoId}`
      : undefined,
    contentUrl: sermon.youtubeUrl,
  };
}

export function stringifyJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
