import type { AdminPermission } from "../../lib/permissions";

export type CmsStatus = "draft" | "published" | "archived";

export type FieldType =
  | "boolean"
  | "date"
  | "datetime"
  | "email"
  | "media"
  | "number"
  | "select"
  | "textarea"
  | "text"
  | "url";

export type CmsField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  options?: string[];
  placeholder?: string;
  helpText?: string;
};

export type CmsModuleConfig = {
  key: string;
  title: string;
  collection: string;
  description: string;
  fields: CmsField[];
  listFields: string[];
  searchFields: string[];
  slugField?: string;
  statusField?: string;
  permission: {
    create: AdminPermission;
    update: AdminPermission;
    delete: AdminPermission;
    publish: AdminPermission;
  };
};

const contentPermissions = {
  create: "content:create",
  update: "content:update",
  delete: "content:delete",
  publish: "content:publish",
} as const;

const settingsPermissions = {
  create: "settings:manage",
  update: "settings:manage",
  delete: "settings:critical:manage",
  publish: "settings:manage",
} as const;

const youtubePermissions = {
  create: "youtube:manage",
  update: "youtube:manage",
  delete: "youtube:manage",
  publish: "youtube:manage",
} as const;

export const cmsModules = [
  {
    key: "homepage-slides",
    title: "Homepage Slides",
    collection: "homepageSlides",
    description: "Hero carousel slides shown on the public homepage.",
    slugField: undefined,
    statusField: "status",
    listFields: ["title", "active", "sortOrder", "status"],
    searchFields: ["title", "subtitle", "imageAlt"],
    permission: contentPermissions,
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "imageUrl", label: "Image", type: "media", required: true },
      { name: "imageAlt", label: "Image Alt Text", type: "text", required: true },
      { name: "primaryCtaLabel", label: "Primary CTA Label", type: "text" },
      { name: "primaryCtaHref", label: "Primary CTA URL", type: "url" },
      { name: "secondaryCtaLabel", label: "Secondary CTA Label", type: "text" },
      { name: "secondaryCtaHref", label: "Secondary CTA URL", type: "url" },
      { name: "overlayOpacity", label: "Overlay Opacity", type: "number", min: 0, max: 1 },
      { name: "sortOrder", label: "Sort Order", type: "number", required: true },
      { name: "active", label: "Active", type: "boolean" },
      { name: "status", label: "Status", type: "select", required: true, options: ["draft", "published", "archived"] },
    ],
  },
  {
    key: "sermons",
    title: "Sermons",
    collection: "sermons",
    description: "Sermon archive items and featured sermon content.",
    slugField: "slug",
    statusField: "status",
    listFields: ["title", "speaker", "sermonDate", "status"],
    searchFields: ["title", "speaker", "series", "scripture", "slug"],
    permission: contentPermissions,
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true, unique: true },
      { name: "speaker", label: "Speaker", type: "text", required: true },
      { name: "sermonDate", label: "Sermon Date", type: "date", required: true },
      { name: "scripture", label: "Scripture", type: "text" },
      { name: "series", label: "Series", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "youtubeUrl", label: "YouTube URL", type: "url" },
      { name: "youtubeVideoId", label: "YouTube Video ID", type: "text" },
      { name: "thumbnailUrl", label: "Thumbnail", type: "media" },
      { name: "thumbnailAlt", label: "Thumbnail Alt Text", type: "text" },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "status", label: "Status", type: "select", required: true, options: ["draft", "published", "archived"] },
      { name: "seoTitle", label: "SEO Title", type: "text" },
      { name: "seoDescription", label: "SEO Description", type: "textarea" },
    ],
  },
  {
    key: "events",
    title: "Events",
    collection: "events",
    description: "Public events, registration links, and recurrence notes.",
    slugField: "slug",
    statusField: "status",
    listFields: ["title", "startDateTime", "location", "status"],
    searchFields: ["title", "slug", "location", "category"],
    permission: contentPermissions,
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true, unique: true },
      { name: "startDateTime", label: "Start Date/Time", type: "datetime", required: true },
      { name: "endDateTime", label: "End Date/Time", type: "datetime" },
      { name: "location", label: "Location", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "imageUrl", label: "Image", type: "media" },
      { name: "imageAlt", label: "Image Alt Text", type: "text" },
      { name: "registrationUrl", label: "Registration URL", type: "url" },
      { name: "recurring", label: "Recurring", type: "boolean" },
      { name: "recurrenceRule", label: "Recurrence Rule", type: "text" },
      { name: "category", label: "Category", type: "text" },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "status", label: "Status", type: "select", required: true, options: ["draft", "published", "archived"] },
      { name: "seoTitle", label: "SEO Title", type: "text" },
      { name: "seoDescription", label: "SEO Description", type: "textarea" },
    ],
  },
  {
    key: "ministries",
    title: "Ministries",
    collection: "ministries",
    description: "Ministry profiles and public ministry landing content.",
    slugField: "slug",
    statusField: "status",
    listFields: ["name", "category", "leaderName", "status"],
    searchFields: ["name", "slug", "category", "leaderName"],
    permission: contentPermissions,
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true, unique: true },
      { name: "category", label: "Category", type: "text" },
      { name: "shortDescription", label: "Short Description", type: "textarea", required: true },
      { name: "longDescription", label: "Long Description", type: "textarea" },
      { name: "leaderName", label: "Leader Name", type: "text" },
      { name: "leaderEmail", label: "Leader Email", type: "email" },
      { name: "meetingTime", label: "Meeting Time", type: "text" },
      { name: "imageUrl", label: "Image", type: "media" },
      { name: "imageAlt", label: "Image Alt Text", type: "text" },
      { name: "ctaLabel", label: "CTA Label", type: "text" },
      { name: "ctaHref", label: "CTA URL", type: "url" },
      { name: "featured", label: "Featured", type: "boolean" },
      { name: "status", label: "Status", type: "select", required: true, options: ["draft", "published", "archived"] },
      { name: "sortOrder", label: "Sort Order", type: "number" },
      { name: "seoTitle", label: "SEO Title", type: "text" },
      { name: "seoDescription", label: "SEO Description", type: "textarea" },
    ],
  },
  {
    key: "leaders",
    title: "Leaders",
    collection: "leaders",
    description: "Leadership profiles for public staff and ministry pages.",
    statusField: undefined,
    listFields: ["name", "title", "active", "sortOrder"],
    searchFields: ["name", "title", "bio", "email"],
    permission: contentPermissions,
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "photoUrl", label: "Photo", type: "media" },
      { name: "photoAlt", label: "Photo Alt Text", type: "text" },
      { name: "bio", label: "Bio", type: "textarea" },
      { name: "email", label: "Email", type: "email" },
      { name: "sortOrder", label: "Sort Order", type: "number" },
      { name: "active", label: "Active", type: "boolean" },
    ],
  },
  {
    key: "announcements",
    title: "Announcements",
    collection: "announcements",
    description: "Short public notices and date-bounded alerts.",
    statusField: "status",
    listFields: ["title", "priority", "startDate", "status"],
    searchFields: ["title", "body", "priority"],
    permission: contentPermissions,
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "body", label: "Body", type: "textarea", required: true },
      { name: "startDate", label: "Start Date", type: "date" },
      { name: "endDate", label: "End Date", type: "date" },
      { name: "priority", label: "Priority", type: "select", options: ["low", "normal", "high", "urgent"] },
      { name: "ctaLabel", label: "CTA Label", type: "text" },
      { name: "ctaHref", label: "CTA URL", type: "url" },
      { name: "status", label: "Status", type: "select", required: true, options: ["draft", "published", "archived"] },
    ],
  },
  {
    key: "resources",
    title: "Resources",
    collection: "resources",
    description: "Downloads and links for public resource pages.",
    slugField: "slug",
    statusField: "status",
    listFields: ["title", "category", "status"],
    searchFields: ["title", "slug", "category", "description"],
    permission: contentPermissions,
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true, unique: true },
      { name: "category", label: "Category", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "fileUrl", label: "File URL", type: "url" },
      { name: "externalUrl", label: "External URL", type: "url" },
      { name: "status", label: "Status", type: "select", required: true, options: ["draft", "published", "archived"] },
      { name: "seoTitle", label: "SEO Title", type: "text" },
      { name: "seoDescription", label: "SEO Description", type: "textarea" },
    ],
  },
  {
    key: "pages",
    title: "Pages",
    collection: "pages",
    description: "Custom CMS pages with rich page body placeholders.",
    slugField: "slug",
    statusField: "status",
    listFields: ["title", "slug", "status"],
    searchFields: ["title", "slug", "content", "seoTitle"],
    permission: contentPermissions,
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true, unique: true },
      { name: "content", label: "Content", type: "textarea" },
      { name: "sections", label: "Sections JSON", type: "textarea", helpText: "Temporary JSON/text field until a section builder is added." },
      { name: "seoTitle", label: "SEO Title", type: "text" },
      { name: "seoDescription", label: "SEO Description", type: "textarea" },
      { name: "status", label: "Status", type: "select", required: true, options: ["draft", "published", "archived"] },
    ],
  },
  {
    key: "site-settings",
    title: "Site Settings",
    collection: "siteSettings",
    description: "Global church contact, service, social, and navigation URLs.",
    statusField: undefined,
    listFields: ["churchName", "email", "phone"],
    searchFields: ["churchName", "email", "phone", "address"],
    permission: settingsPermissions,
    fields: [
      { name: "churchName", label: "Church Name", type: "text", required: true },
      { name: "address", label: "Address", type: "textarea" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "serviceTimes", label: "Service Times", type: "textarea" },
      { name: "socialLinks", label: "Social Links JSON", type: "textarea" },
      { name: "givingUrl", label: "Giving URL", type: "url" },
      { name: "livestreamUrlFallback", label: "Livestream URL Fallback", type: "url" },
      { name: "mapUrl", label: "Map URL", type: "url" },
    ],
  },
  {
    key: "youtube-settings",
    title: "YouTube Settings",
    collection: "youtubeSettings",
    description: "YouTube channel and livestream integration settings.",
    statusField: undefined,
    listFields: ["channelId", "featuredVideoId", "showLiveBanner"],
    searchFields: ["channelId", "channelUrl", "featuredVideoId"],
    permission: youtubePermissions,
    fields: [
      { name: "channelId", label: "Channel ID", type: "text", required: true },
      { name: "channelUrl", label: "Channel URL", type: "url" },
      { name: "liveStreamUrl", label: "Live Stream URL", type: "url" },
      { name: "uploadsPlaylistId", label: "Uploads Playlist ID", type: "text" },
      { name: "featuredVideoId", label: "Featured Video ID", type: "text" },
      { name: "autoFetchLatestSermons", label: "Auto-fetch Latest Sermons", type: "boolean" },
      { name: "showLiveBanner", label: "Show Live Banner", type: "boolean" },
    ],
  },
] satisfies CmsModuleConfig[];

export type CmsModuleKey = (typeof cmsModules)[number]["key"];

export const defaultModuleKey: CmsModuleKey = "homepage-slides";

export function getCmsModule(key: string | undefined): CmsModuleConfig {
  return cmsModules.find((moduleConfig) => moduleConfig.key === key) ?? cmsModules[0];
}
