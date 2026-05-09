import { z } from "zod";

export const emailSchema = z.string().email();

export const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case (lowercase, hyphens).");

export const urlSchema = z.string().url();
export const optionalUrlSchema = z.string().url().nullable();
export const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"), "URL must use HTTPS.");

export const userRoleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"]);
export const contentStatusSchema = z.enum(["draft", "published", "archived"]);
export const formSubmissionStatusSchema = z.enum(["new", "in_review", "completed", "archived"]);
export const formTypeSchema = z.enum([
  "contact",
  "prayer_request",
  "volunteer",
  "plan_visit",
  "membership_transfer",
  "maintenance_request",
  "submit_announcement",
]);

export const eventCategorySchema = z.enum([
  "worship",
  "fellowship",
  "outreach",
  "youth",
  "children",
  "prayer",
  "education",
  "music",
  "service",
  "special",
]);

export const ministryCategorySchema = z.enum([
  "children",
  "youth",
  "adults",
  "family",
  "outreach",
  "worship",
  "service",
  "education",
  "health",
]);

export const announcementPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);

export const resourceCategorySchema = z.enum([
  "bulletin",
  "study_guide",
  "form",
  "policy",
  "newsletter",
  "audio",
  "video",
  "other",
]);

export const siteSettingsGroupSchema = z.enum([
  "general",
  "contact",
  "social",
  "giving",
  "service_times",
  "seo",
]);

export const auditActionSchema = z.enum([
  "create",
  "update",
  "delete",
  "publish",
  "archive",
  "login",
  "logout",
  "role_change",
  "settings_update",
]);

const isoOrDate = z.union([z.string().datetime({ offset: true }), z.date()]);

// users
export const userSchema = z.object({
  uid: z.string().min(1),
  name: z.string().min(2).max(120),
  email: emailSchema,
  role: userRoleSchema,
  approved: z.boolean(),
  disabled: z.boolean(),
  photoUrl: urlSchema.nullable(),
});

// homepageSlides
export const homepageSlideSchema = z.object({
  title: z.string().min(2).max(120),
  subtitle: z.string().max(280),
  imageUrl: urlSchema,
  imageAlt: z.string().min(2).max(200),
  primaryCtaLabel: z.string().min(1).max(40),
  primaryCtaHref: z.string().min(1).max(300),
  secondaryCtaLabel: z.string().min(1).max(40).nullable(),
  secondaryCtaHref: z.string().min(1).max(300).nullable(),
  overlayOpacity: z.number().min(0).max(1),
  sortOrder: z.number().int().min(0),
  active: z.boolean(),
  status: contentStatusSchema,
});

// sermons
export const sermonSchema = z.object({
  title: z.string().min(2).max(180),
  slug: slugSchema,
  speaker: z.string().min(2).max(120),
  sermonDate: isoOrDate,
  scripture: z.string().min(2).max(200),
  series: z.string().max(120).nullable(),
  description: z.string().max(2000),
  youtubeUrl: urlSchema,
  youtubeVideoId: z.string().min(5).max(40),
  thumbnailUrl: urlSchema,
  thumbnailAlt: z.string().min(2).max(200),
  featured: z.boolean(),
  status: contentStatusSchema,
  seoTitle: z.string().max(70),
  seoDescription: z.string().max(160),
});

// events
export const eventSchema = z
  .object({
    title: z.string().min(2).max(180),
    slug: slugSchema,
    startDateTime: isoOrDate,
    endDateTime: isoOrDate,
    location: z.string().min(2).max(200),
    description: z.string().max(4000),
    imageUrl: urlSchema,
    imageAlt: z.string().min(2).max(200),
    registrationUrl: urlSchema.nullable(),
    recurring: z.boolean(),
    recurrenceRule: z.string().max(500).nullable(),
    category: eventCategorySchema,
    featured: z.boolean(),
    status: contentStatusSchema,
    seoTitle: z.string().max(70),
    seoDescription: z.string().max(160),
  })
  .refine(
    (data) => new Date(data.endDateTime as string | Date) >= new Date(data.startDateTime as string | Date),
    { message: "endDateTime must be on or after startDateTime", path: ["endDateTime"] },
  );

// ministries
export const ministrySchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema,
  category: ministryCategorySchema,
  shortDescription: z.string().min(10).max(280),
  longDescription: z.string().max(4000),
  leaderName: z.string().min(2).max(120),
  leaderEmail: emailSchema,
  meetingTime: z.string().max(160),
  imageUrl: urlSchema,
  imageAlt: z.string().min(2).max(200),
  ctaLabel: z.string().min(1).max(40),
  ctaHref: z.string().min(1).max(300),
  featured: z.boolean(),
  status: contentStatusSchema,
  sortOrder: z.number().int().min(0),
  seoTitle: z.string().max(70),
  seoDescription: z.string().max(160),
});

// leaders
export const leaderSchema = z.object({
  name: z.string().min(2).max(120),
  title: z.string().min(2).max(120),
  photoUrl: urlSchema,
  photoAlt: z.string().min(2).max(200),
  bio: z.string().min(10).max(2000),
  email: emailSchema,
  sortOrder: z.number().int().min(0),
  active: z.boolean(),
});

// announcements
export const announcementSchema = z
  .object({
    title: z.string().min(2).max(160),
    body: z.string().min(5).max(2000),
    startDate: isoOrDate,
    endDate: isoOrDate,
    priority: announcementPrioritySchema,
    ctaLabel: z.string().min(1).max(40).nullable(),
    ctaHref: z.string().min(1).max(300).nullable(),
    status: contentStatusSchema,
  })
  .refine(
    (data) => new Date(data.endDate as string | Date) >= new Date(data.startDate as string | Date),
    { message: "endDate must be on or after startDate", path: ["endDate"] },
  );

// resources
export const resourceSchema = z
  .object({
    title: z.string().min(2).max(180),
    slug: slugSchema,
    category: resourceCategorySchema,
    description: z.string().max(2000),
    fileUrl: urlSchema.nullable(),
    externalUrl: urlSchema.nullable(),
    status: contentStatusSchema,
    seoTitle: z.string().max(70),
    seoDescription: z.string().max(160),
  })
  .refine((data) => data.fileUrl !== null || data.externalUrl !== null, {
    message: "Either fileUrl or externalUrl must be provided",
    path: ["fileUrl"],
  });

// mediaAssets
export const mediaAssetSchema = z.object({
  filename: z.string().min(1).max(200),
  originalFilename: z.string().min(1).max(255),
  url: urlSchema,
  storagePath: z.string().min(1).max(500),
  altText: z.string().max(200),
  mimeType: z.string().min(3).max(100),
  size: z.number().int().nonnegative(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  uploadedBy: z.string().min(1).nullable(),
  compressed: z.boolean(),
  originalSize: z.number().int().nonnegative().nullable(),
  compressedSize: z.number().int().nonnegative().nullable(),
});

// formSubmissions
export const formSubmissionPayloadSchema: z.ZodType<
  Record<string, string | number | boolean | string[] | null>
> = z.record(
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.null(),
  ]),
);

export const formSubmissionSchema = z.object({
  formType: formTypeSchema,
  name: z.string().min(2).max(120),
  email: emailSchema,
  phone: z.string().min(7).max(40).nullable(),
  subject: z.string().max(200).nullable(),
  message: z.string().min(5).max(4000),
  payloadJson: formSubmissionPayloadSchema,
  status: formSubmissionStatusSchema,
  assignedTo: z.string().min(1).nullable(),
  internalNotes: z.string().max(4000),
});

// public-facing form input schemas (no status/assignedTo/internalNotes)
export const contactFormSchema = z.object({
  name: z.string().min(2).max(120),
  email: emailSchema,
  phone: z.string().min(7).max(40).optional(),
  subject: z.string().min(2).max(200).optional(),
  message: z.string().min(10).max(4000),
});

export const prayerRequestFormSchema = z.object({
  name: z.string().min(2).max(120),
  email: emailSchema,
  phone: z.string().min(7).max(40).optional(),
  message: z.string().min(5).max(4000),
  shareWithPrayerTeam: z.boolean().default(true),
});

// siteSettings
export const siteSettingValueSchema: z.ZodType<
  string | number | boolean | null | string[] | Record<string, string | number | boolean | null>
> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
  z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])),
]);

export const siteSettingSchema = z.object({
  key: z.string().min(1).max(80),
  value: siteSettingValueSchema,
  group: siteSettingsGroupSchema,
});

// pages
export const pageSectionSchema = z.object({
  type: z.enum(["hero", "richText", "imageText", "cards", "cta"]),
  heading: z.string().max(200).nullable(),
  body: z.string().max(8000).nullable(),
  imageUrl: urlSchema.nullable(),
  href: z.string().max(300).nullable(),
  cta: z.string().max(80).nullable(),
});

export const pageSchema = z.object({
  title: z.string().min(2).max(180),
  slug: slugSchema,
  content: z.string().max(20000),
  sections: z.array(pageSectionSchema),
  seoTitle: z.string().max(70),
  seoDescription: z.string().max(160),
  status: contentStatusSchema,
});

// youtubeSettings
export const youtubeSettingsSchema = z.object({
  channelId: z.string().min(5).max(80),
  channelUrl: urlSchema,
  liveStreamUrl: urlSchema.nullable(),
  uploadsPlaylistId: z.string().min(5).max(80).nullable(),
  featuredVideoId: z.string().min(5).max(40).nullable(),
  autoFetchLatestSermons: z.boolean(),
  showLiveBanner: z.boolean(),
});

// auditLogs
export const auditLogSchema = z.object({
  actorUid: z.string().min(1),
  actorEmail: emailSchema,
  action: auditActionSchema,
  collection: z.string().min(1).max(80),
  documentId: z.string().min(1).max(200),
  details: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).nullable(),
});

export const collectionSchemas = {
  users: userSchema,
  homepageSlides: homepageSlideSchema,
  sermons: sermonSchema,
  events: eventSchema,
  ministries: ministrySchema,
  leaders: leaderSchema,
  announcements: announcementSchema,
  resources: resourceSchema,
  mediaAssets: mediaAssetSchema,
  formSubmissions: formSubmissionSchema,
  siteSettings: siteSettingSchema,
  pages: pageSchema,
  youtubeSettings: youtubeSettingsSchema,
  auditLogs: auditLogSchema,
} as const;

export type CollectionSchemaName = keyof typeof collectionSchemas;
