import type { Announcement, AnnouncementCategory } from "@/types/content";

export const ANNOUNCEMENT_CATEGORIES = [
  "general",
  "worship",
  "ministry",
  "school",
  "community",
  "prayer",
  "health",
  "service",
  "special",
  "other",
] as const satisfies readonly AnnouncementCategory[];

const ANNOUNCEMENT_CATEGORY_SET = new Set<string>(ANNOUNCEMENT_CATEGORIES);
const SUMMARY_MAX_LENGTH = 300;

export type NormalizedAnnouncement = Announcement & {
  slug: string;
  summary: string;
  category: AnnouncementCategory;
  publishToWebsite: boolean;
  showInAnnouncementBar: boolean;
  showOnHomepage: boolean;
};

export function slugifyAnnouncementTitle(title: unknown): string {
  if (typeof title !== "string") return "announcement";

  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");

  return slug.length >= 2 ? slug : "announcement";
}

export function deriveAnnouncementSummary(body: unknown): string {
  if (typeof body !== "string") return "";

  const plainText = body
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= SUMMARY_MAX_LENGTH) return plainText;

  const clipped = plainText.slice(0, SUMMARY_MAX_LENGTH - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const safeCut = lastSpace >= 200 ? clipped.slice(0, lastSpace) : clipped;
  return `${safeCut.trimEnd()}…`;
}

export function normalizeAnnouncement(
  announcement: Record<string, unknown>,
): Record<string, unknown> & NormalizedAnnouncement {
  const explicitSlug =
    typeof announcement.slug === "string" && announcement.slug.trim()
      ? announcement.slug.trim()
      : null;
  const explicitSummary =
    typeof announcement.summary === "string" && announcement.summary.trim()
      ? announcement.summary.trim()
      : null;
  const category =
    typeof announcement.category === "string" &&
    ANNOUNCEMENT_CATEGORY_SET.has(announcement.category)
      ? (announcement.category as AnnouncementCategory)
      : "general";

  return {
    ...announcement,
    slug: explicitSlug ?? slugifyAnnouncementTitle(announcement.title),
    summary: explicitSummary ?? deriveAnnouncementSummary(announcement.body),
    category,
    publishToWebsite:
      typeof announcement.publishToWebsite === "boolean"
        ? announcement.publishToWebsite
        : true,
    showInAnnouncementBar:
      typeof announcement.showInAnnouncementBar === "boolean"
        ? announcement.showInAnnouncementBar
        : true,
    showOnHomepage:
      typeof announcement.showOnHomepage === "boolean"
        ? announcement.showOnHomepage
        : false,
  } as Record<string, unknown> & NormalizedAnnouncement;
}

export function buildAnnouncementMigrationPatch(
  announcement: Record<string, unknown>,
): Record<string, unknown> {
  const normalized = normalizeAnnouncement(announcement);
  const patch: Record<string, unknown> = {};

  for (const field of [
    "slug",
    "summary",
    "category",
    "publishToWebsite",
    "showInAnnouncementBar",
    "showOnHomepage",
  ] as const) {
    if (typeof announcement[field] === "undefined") {
      patch[field] = normalized[field];
    }
  }

  return patch;
}
