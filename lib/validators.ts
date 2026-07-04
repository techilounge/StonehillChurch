import { z } from "zod";

export const emailSchema = z.string().email();

export const slugSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case (lowercase, hyphens).");

export const urlSchema = z.string().url();
export const optionalUrlSchema = z.string().url().nullable();
export const configurableUrlSchema = z.union([z.string().url(), z.literal("")]);
export const configurableOptionalUrlSchema = z.union([z.string().url(), z.literal(""), z.null()]);
export const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"), "URL must use HTTPS.");

export const userRoleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"]);
export const invitableUserRoleSchema = z.enum(["ADMIN", "EDITOR", "VIEWER"]);
export const userInviteStatusSchema = z.enum(["pending", "accepted", "expired", "revoked"]);
export const contentStatusSchema = z.enum(["draft", "published", "archived"]);
export const formSubmissionStatusSchema = z.enum(["new", "in_review", "completed", "archived"]);
export const formTypeSchema = z.enum([
  "contact",
  "prayer_request",
  "volunteer",
  "announcement_request",
  "membership_transfer",
  "maintenance_request",
  "plan_your_visit",
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
  "design",
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
  imageAlignment: z.enum(["center", "top", "bottom", "left", "right", "top center", "bottom center"]).default("center"),
  focalPointZoom: z.number().int().min(-40).max(40).default(0),
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
  series: z.string().max(120).nullable().optional(),
  description: z.string().max(2000).optional(),
  youtubeUrl: urlSchema,
  youtubeVideoId: z.string().min(5).max(40),
  thumbnailUrl: urlSchema,
  thumbnailAlt: z.string().min(2).max(200),
  featured: z.boolean().optional(),
  status: contentStatusSchema,
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

// events
export const eventSchema = z
  .object({
    title: z.string().min(2).max(180),
    slug: slugSchema,
    startDateTime: isoOrDate,
    // endDateTime is optional/nullable so events flagged "endsNever" can omit
    // it. The cross-field refine below still enforces ordering when both are
    // present.
    endDateTime: isoOrDate.nullable().optional(),
    endsNever: z.boolean().optional(),
    location: z.string().min(2).max(200),
    description: z.string().max(4000).optional(),
    imageUrl: urlSchema,
    imageAlt: z.string().min(2).max(200),
    registrationUrl: urlSchema.nullable().optional(),
    registrationOpenInNewTab: z.boolean().optional(),
    recurring: z.boolean().optional(),
    recurrenceRule: z.string().max(500).nullable().optional(),
    // "HH:MM" 24-hour strings; nullable so they can be cleared.
    recurrenceStartTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Expected HH:MM")
      .nullable()
      .optional(),
    recurrenceEndTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Expected HH:MM")
      .nullable()
      .optional(),
    category: eventCategorySchema,
    featured: z.boolean().optional(),
    status: contentStatusSchema,
    seoTitle: z.string().max(70).optional(),
    seoDescription: z.string().max(160).optional(),
  })
  .refine(
    (data) => {
      if (data.endsNever === true) return true;
      if (data.endDateTime === null || data.endDateTime === undefined) return false;
      return (
        new Date(data.endDateTime as string | Date) >=
        new Date(data.startDateTime as string | Date)
      );
    },
    { message: "endDateTime must be on or after startDateTime", path: ["endDateTime"] },
  );

// ministries
export const ministrySchema = z.object({
  name: z.string().min(2).max(120),
  slug: slugSchema,
  category: ministryCategorySchema,
  shortDescription: z.string().min(10).max(280),
  longDescription: z.string().max(4000).optional(),
  leaderName: z.string().min(2).max(120),
  leaderEmail: emailSchema,
  meetingTime: z.string().max(160).optional(),
  imageUrl: urlSchema,
  imageAlt: z.string().min(2).max(200),
  ctaLabel: z.string().min(1).max(40),
  ctaHref: z.string().min(1).max(300),
  openInNewTab: z.boolean().optional().default(false),
  featured: z.boolean().optional(),
  status: contentStatusSchema,
  sortOrder: z.number().int().min(0),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
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
  // Category is optional; empty string means "Uncategorized". The form sends
  // "" when nothing is selected, so we accept any short string.
  category: z.string().max(80).optional(),
  // When true, this leader is featured in the homepage Welcome section
  // (capped at the first two flagged leaders by sortOrder).
  featuredOnHomepage: z.boolean().optional(),
});

// leaderCategories
export const leaderCategorySchema = z.object({
  name: z.string().min(2).max(80),
  sortOrder: z.number().int().min(0),
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
    openInNewTab: z.boolean().optional(),
    imageUrl: urlSchema.nullable(),
    imageAlt: z.string().min(2).max(200).nullable(),
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
  email: emailSchema.nullable(),
  phone: z.string().min(7).max(40).nullable(),
  subject: z.string().max(200).nullable(),
  message: z.string().min(5).max(4000),
  payloadJson: formSubmissionPayloadSchema,
  status: formSubmissionStatusSchema,
  assignedTo: z.string().min(1).nullable(),
  internalNotes: z.string().max(4000),
});

// public-facing form input schemas (no status/assignedTo/internalNotes)
const optionalFormText = (max = 4000) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const nullableFormText = (max = 4000) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable().optional(),
  );

const requiredFormText = (min: number, max: number) => z.string().trim().min(min).max(max);

const formArraySchema = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim()) {
      return [value.trim()];
    }
    return value;
  },
  z.array(z.string().trim().min(1).max(120)).max(20).optional(),
);

const basePublicFormSchema = z.object({
  name: z.string().min(2).max(120),
  email: emailSchema,
  phone: optionalFormText(40),
  subject: optionalFormText(200),
});

export const contactFormSchema = basePublicFormSchema.extend({
  formType: z.literal("contact"),
  message: z.string().min(10).max(4000),
});

export const prayerRequestFormSchema = basePublicFormSchema.extend({
  formType: z.literal("prayer_request"),
  message: z.string().min(5).max(4000),
  shareWithPrayerTeam: z.boolean().default(true),
  confidential: z.boolean().default(false),
});

export const volunteerFormSchema = basePublicFormSchema.extend({
  formType: z.literal("volunteer"),
  areas: formArraySchema,
  availability: optionalFormText(1000),
  message: z.string().min(5).max(4000),
});

export const announcementRequestFormSchema = basePublicFormSchema.extend({
  formType: z.literal("announcement_request"),
  announcementTitle: requiredFormText(2, 160),
  announcementBody: requiredFormText(5, 2000),
  requestedStartDate: optionalFormText(80),
  requestedEndDate: optionalFormText(80),
  message: z.string().max(4000).default("Announcement request submitted."),
});

export const membershipTransferFormSchema = basePublicFormSchema.extend({
  formType: z.literal("membership_transfer"),
  transferDirection: z.enum(["to_stonehill", "from_stonehill", "other"]).default("to_stonehill"),
  currentChurch: nullableFormText(200),
  receivingChurch: nullableFormText(200),
  message: z.string().min(5).max(4000),
});

export const maintenanceRequestFormSchema = basePublicFormSchema.extend({
  formType: z.literal("maintenance_request"),
  location: requiredFormText(2, 200),
  issue: requiredFormText(5, 2000),
  urgency: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  message: z.string().max(4000).default("Maintenance request submitted."),
});

export const planYourVisitFormSchema = basePublicFormSchema.extend({
  formType: z.literal("plan_your_visit"),
  visitDate: requiredFormText(2, 100),
  numberOfAdults: z.number().int().min(1).max(100).default(1),
  numberOfChildren: z.number().int().min(0).max(100).default(0),
  message: z.string().max(4000).default(""),
});

export const publicFormSubmissionSchema = z.discriminatedUnion("formType", [
  contactFormSchema,
  prayerRequestFormSchema,
  volunteerFormSchema,
  announcementRequestFormSchema,
  membershipTransferFormSchema,
  maintenanceRequestFormSchema,
  planYourVisitFormSchema,
]);

export const formSubmissionStatusUpdateSchema = z.object({
  status: formSubmissionStatusSchema,
  assignedTo: z.string().trim().min(1).max(160).nullable().optional(),
  internalNotes: z.string().trim().max(4000).optional(),
});

// userInvites
export const userInviteSchema = z.object({
  email: emailSchema,
  name: z.string().min(2).max(120).nullable(),
  role: invitableUserRoleSchema,
  tokenHash: z.string().length(64),
  status: userInviteStatusSchema,
  expiresAt: isoOrDate,
  invitedByUid: z.string().min(1),
  invitedByEmail: emailSchema.nullable(),
  acceptedByUid: z.string().min(1).nullable(),
  revokedByUid: z.string().min(1).nullable(),
  resendMessageId: z.string().min(1).nullable(),
});

// siteSettings
const siteSettingPrimitiveSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

// Allow up to two levels of nesting so structured configs
// (e.g. { height: { mode, preset, customValue, unit } }) pass validation.
const siteSettingNestedRecordSchema = z.record(
  z.union([
    siteSettingPrimitiveSchema,
    z.record(siteSettingPrimitiveSchema),
  ]),
);

export const siteSettingValueSchema: z.ZodType<
  | string
  | number
  | boolean
  | null
  | string[]
  | Record<string, string | number | boolean | null | Record<string, string | number | boolean | null>>
> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
  siteSettingNestedRecordSchema,
]);

export const siteSettingSchema = z.object({
  key: z.string().min(1).max(80),
  value: siteSettingValueSchema,
  group: siteSettingsGroupSchema,
});

// page builder
export const blockTypeSchema = z.enum([
  "heading",
  "paragraph",
  "image",
  "button",
  "video",
  "divider",
  "spacer",
  "card",
  "cta",
  "iconText",
  "iconBox",
  "googleMap",
  "gallery",
  "carousel",
  "countdown",
]);

const paddingValuesValidator = z
  .object({
    top: z.number().min(0).max(500),
    right: z.number().min(0).max(500),
    bottom: z.number().min(0).max(500),
    left: z.number().min(0).max(500),
    unit: z.enum(["px", "rem", "%"]).optional(),
    linked: z.boolean().optional(),
    token: z.enum(["xs", "sm", "md", "lg", "xl"]).optional(),
  })
  .optional();

const marginValuesValidator = z
  .object({
    top: z.number().min(-500).max(500),
    right: z.number().min(-500).max(500),
    bottom: z.number().min(-500).max(500),
    left: z.number().min(-500).max(500),
    unit: z.enum(["px", "rem", "%"]).optional(),
    linked: z.boolean().optional(),
    token: z.enum(["xs", "sm", "md", "lg", "xl"]).optional(),
  })
  .optional();

export const blockStyleSchema = z.object({
  padding: z.string().max(80).optional(),
  paddingValues: paddingValuesValidator,
  paddingValuesTablet: paddingValuesValidator,
  paddingValuesMobile: paddingValuesValidator,
  margin: z.string().max(80).optional(),
  marginValues: marginValuesValidator,
  marginValuesTablet: marginValuesValidator,
  marginValuesMobile: marginValuesValidator,
  textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  textColor: z.string().max(40).optional(),
  backgroundColor: z.string().max(40).optional(),
  fontSize: z.string().max(40).optional(),
  fontWeight: z.string().max(40).optional(),
});

export const pageBlockSchema = z.object({
  id: z.string().min(1).max(80),
  type: blockTypeSchema,
  content: z.any(),
  style: blockStyleSchema.optional(),
});

export const pageColumnSchema = z.object({
  id: z.string().min(1).max(80),
  blocks: z.array(pageBlockSchema),
  width: z.string().max(40).optional(),
  style: blockStyleSchema.optional(),
});

export const sectionTypeSchema = z.enum(["section", "row", "columns", "group"]);

export const sectionStyleSchema = z.object({
  padding: z.string().max(80).optional(),
  paddingValues: paddingValuesValidator,
  paddingValuesTablet: paddingValuesValidator,
  paddingValuesMobile: paddingValuesValidator,
  margin: z.string().max(80).optional(),
  marginValues: marginValuesValidator,
  marginValuesTablet: marginValuesValidator,
  marginValuesMobile: marginValuesValidator,
  backgroundType: z.enum(["none", "color", "image", "gradient"]).optional(),
  backgroundColor: z.string().max(40).optional(),
  backgroundImage: z.string().max(300).optional(),
  backgroundGradient: z
    .object({
      from: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      to: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      angle: z.number().min(0).max(360),
    })
    .optional(),
  backgroundPosition: z
    .enum([
      "center center",
      "top center",
      "bottom center",
      "left center",
      "right center",
      "top left",
      "top right",
      "bottom left",
      "bottom right",
    ])
    .optional(),
  backgroundSize: z.enum(["cover", "contain", "auto"]).optional(),
  backgroundRepeat: z.enum(["no-repeat", "repeat", "repeat-x", "repeat-y"]).optional(),
  backgroundAttachment: z.enum(["scroll", "fixed"]).optional(),
  overlayColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  overlayOpacity: z.number().min(0).max(1).optional(),
  textColor: z.string().max(40).optional(),
  layoutWidth: z.enum(["full", "content"]).optional(),
  verticalSpacing: z.string().max(40).optional(),
  mobileStacking: z.enum(["stack", "reverse", "keep"]).optional(),
  alignItems: z.enum(["start", "center", "end", "stretch"]).optional(),
  justifyContent: z.enum(["start", "center", "end", "between", "around"]).optional(),
});

export const pageBuilderRowSchema = z.object({
  id: z.string().min(1).max(80),
  layout: z.enum(["1-col", "2-col", "3-col", "4-col", "left-sidebar", "right-sidebar"]).optional(),
  columns: z.array(pageColumnSchema),
  style: sectionStyleSchema.optional(),
});

export const pageBuilderSectionSchema = z.object({
  id: z.string().min(1).max(80),
  type: sectionTypeSchema,
  layout: z.enum(["1-col", "2-col", "3-col", "4-col", "left-sidebar", "right-sidebar"]).optional(),
  // Preferred shape — a section is a stack of rows.
  rows: z.array(pageBuilderRowSchema).optional(),
  // Legacy fields are still accepted for backward compatibility with documents
  // that pre-date the rows model.
  columns: z.array(pageColumnSchema).optional(),
  blocks: z.array(pageBlockSchema).optional(),
  style: sectionStyleSchema.optional(),
});

export const patternTemplateSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  category: z.enum(["hero", "about", "feature", "call_to_action", "general"]),
  sections: z.array(pageBuilderSectionSchema),
});

export const pageBuilderDocumentSchema = z.object({
  version: z.literal("1.0"),
  sections: z.array(pageBuilderSectionSchema),
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
  builderData: pageBuilderDocumentSchema.optional(),
  seoTitle: z.string().max(70).nullable().optional(),
  seoDescription: z.string().max(160).nullable().optional(),
  status: contentStatusSchema,
  // Optional "Back to ..." link rendered above the builder content. URL safety
  // is also enforced by isValidSafeUrl on render so a bad value never produces
  // a working javascript:/data: link.
  backLinkEnabled: z.boolean().optional(),
  backLinkHref: z.string().max(300).optional(),
  backLinkLabel: z.string().max(80).optional(),
  // Optional dark-navy page-hero banner (matches /about, /our-beliefs, etc.).
  // When enabled, renders <PageHero> with the page title plus an optional
  // handwritten subtitle and background image.
  heroEnabled: z.boolean().optional(),
  heroSubtitle: z.string().max(200).optional(),
  heroImageUrl: z.string().max(500).optional(),
  // Optional page-level background — same field shape as the section background
  // panel so the inspector can drive both.
  pageBackground: z
    .object({
      backgroundType: z.enum(["none", "color", "image", "gradient"]).optional(),
      backgroundColor: z.string().max(40).optional(),
      backgroundImage: z.string().max(300).optional(),
      backgroundGradient: z
        .object({
          from: z.string().regex(/^#[0-9a-fA-F]{6}$/),
          to: z.string().regex(/^#[0-9a-fA-F]{6}$/),
          angle: z.number().min(0).max(360),
        })
        .optional(),
      backgroundPosition: z
        .enum([
          "center center",
          "top center",
          "bottom center",
          "left center",
          "right center",
          "top left",
          "top right",
          "bottom left",
          "bottom right",
        ])
        .optional(),
      backgroundSize: z.enum(["cover", "contain", "auto"]).optional(),
      backgroundRepeat: z.enum(["no-repeat", "repeat", "repeat-x", "repeat-y"]).optional(),
      backgroundAttachment: z.enum(["scroll", "fixed"]).optional(),
      overlayColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
      overlayOpacity: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

// popups
export const popupMediaTypeSchema = z.enum(["image", "video"]);
export const popupAnimationStyleSchema = z.enum(["fade", "scale", "fade-scale"]);
export const popupBackdropStyleSchema = z.enum(["solid", "blur", "gradient"]);
export const popupWidthPresetSchema = z.enum(["auto", "small", "medium", "large"]);
export const popupHeightPresetSchema = z.enum(["auto", "fit", "scroll"]);
export const popupTriggerTypeSchema = z.enum(["image", "button", "link"]);
export const popupCaptionAlignmentSchema = z.enum(["left", "center", "right"]);
export const popupFrequencyModeSchema = z.enum(["every", "once", "interval"]);
export const popupFrequencyIntervalUnitSchema = z.enum(["minutes", "hours", "days"]);

export const popupSchema = z
  .object({
    title: z.string().min(2).max(160),
    mediaType: popupMediaTypeSchema,
    imageUrl: urlSchema.nullable(),
    imageAlt: z.string().min(2).max(200).nullable(),
    videoUrl: urlSchema.nullable(),
    videoAutoplay: z.boolean(),
    videoMuted: z.boolean(),
    videoLoop: z.boolean(),
    videoMaintain16x9: z.boolean(),
    startTime: isoOrDate.nullable(),
    endTime: isoOrDate.nullable(),
    animationStyle: popupAnimationStyleSchema,
    animationDurationMs: z.number().int().min(100).max(2000),
    backdropStyle: popupBackdropStyleSchema,
    backdropOpacity: z.number().min(0).max(1),
    backdropBlur: z.number().min(0).max(40),
    widthPreset: popupWidthPresetSchema,
    heightPreset: popupHeightPresetSchema,
    triggerType: popupTriggerTypeSchema,
    triggerLabel: z.string().min(1).max(80).nullable(),
    captionText: z.string().max(500).nullable(),
    captionShow: z.boolean(),
    captionAlignment: popupCaptionAlignmentSchema,
    frequencyMode: popupFrequencyModeSchema,
    frequencyIntervalValue: z.number().int().min(1).max(10000).nullable(),
    frequencyIntervalUnit: popupFrequencyIntervalUnitSchema.nullable(),
    status: contentStatusSchema,
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      return new Date(data.endTime as string | Date) > new Date(data.startTime as string | Date);
    },
    { message: "endTime must be after startTime", path: ["endTime"] },
  )
  .refine(
    (data) => data.mediaType !== "image" || Boolean(data.imageUrl),
    { message: "Image is required for image popups", path: ["imageUrl"] },
  )
  .refine(
    (data) => data.mediaType !== "video" || Boolean(data.videoUrl),
    { message: "Video URL is required for video popups", path: ["videoUrl"] },
  )
  .refine(
    (data) =>
      data.frequencyMode !== "interval" ||
      (data.frequencyIntervalValue !== null && data.frequencyIntervalValue >= 1),
    {
      message: "Interval value is required when frequency is 'Show on Time Interval'.",
      path: ["frequencyIntervalValue"],
    },
  )
  .refine(
    (data) => data.frequencyMode !== "interval" || data.frequencyIntervalUnit !== null,
    {
      message: "Interval unit is required when frequency is 'Show on Time Interval'.",
      path: ["frequencyIntervalUnit"],
    },
  );

// youtubeSettings
export const youtubeSettingsSchema = z.object({
  channelId: z.string().max(80),
  channelUrl: configurableUrlSchema,
  liveStreamUrl: configurableOptionalUrlSchema,
  uploadsPlaylistId: z.string().max(80).nullable(),
  featuredVideoId: z.string().max(40).nullable(),
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

// menus
export const menuLocationSchema = z.enum(["header", "footer"]);

const menuChildItemSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(80),
  url: z.string().min(1).max(500),
  openInNewTab: z.boolean(),
  children: z.array(z.any()).max(0).default([]),
});

export const menuItemSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(80),
  url: z.string().min(1).max(500),
  openInNewTab: z.boolean(),
  children: z.array(menuChildItemSchema).max(20).default([]),
});

export const menuDocumentSchema = z.object({
  location: menuLocationSchema,
  items: z.array(menuItemSchema).max(30),
});

export const collectionSchemas = {
  users: userSchema,
  homepageSlides: homepageSlideSchema,
  sermons: sermonSchema,
  events: eventSchema,
  ministries: ministrySchema,
  leaders: leaderSchema,
  leaderCategories: leaderCategorySchema,
  announcements: announcementSchema,
  resources: resourceSchema,
  mediaAssets: mediaAssetSchema,
  formSubmissions: formSubmissionSchema,
  siteSettings: siteSettingSchema,
  pages: pageSchema,
  popups: popupSchema,
  youtubeSettings: youtubeSettingsSchema,
  auditLogs: auditLogSchema,
} as const;

export type CollectionSchemaName = keyof typeof collectionSchemas;
