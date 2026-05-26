import { z } from "zod";
import type { CmsModule } from "@/lib/data/adminCms";

export type FieldType =
  | "text"
  | "textarea"
  | "slug"
  | "select"
  | "boolean"
  | "date"
  | "datetime"
  | "number"
  | "url"
  | "email"
  | "media"
  | "videoUpload"
  | "richText";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  description?: string;
  options?: { label: string; value: string }[];
  placeholder?: string;
  hiddenOnList?: boolean;
  // Initial value used when creating a new document. Lets the form open
  // pre-populated with sensible choices (animation style, opacity, etc.)
  // that the user can still override.
  defaultValue?: unknown;
  // When provided, the field is hidden in the form whenever the predicate
  // returns false against the current form data. Validation in
  // [lib/validators.ts] still enforces cross-field requirements server-side.
  showWhen?: (data: Record<string, unknown>) => boolean;
}

export interface CmsUIConfig {
  module: CmsModule;
  title: string;
  singular: string;
  description: string;
  fields: FieldConfig[];
}

export const CMS_CONFIG: Record<Exclude<CmsModule, "siteSettings">, CmsUIConfig> = {
  homepageSlides: {
    module: "homepageSlides",
    title: "Homepage Slides",
    singular: "Slide",
    description: "Manage the hero banner slides on the public homepage.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "subtitle", label: "Subtitle", type: "textarea", required: false, hiddenOnList: true },
      { name: "imageUrl", label: "Background Image", type: "media", required: true },
      { name: "imageAlt", label: "Image Alt Text", type: "text", required: true, hiddenOnList: true },
      { name: "imageAlignment", label: "Image Focus Area", type: "select", required: true, hiddenOnList: true, options: [
        { label: "Center", value: "center" },
        { label: "Top", value: "top" },
        { label: "Bottom", value: "bottom" },
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
        { label: "Top Center", value: "top center" },
        { label: "Bottom Center", value: "bottom center" }
      ]},
      { name: "focalPointZoom", label: "Focal Zoom (%)", type: "number", required: false, hiddenOnList: true, description: "Negative (−40 to −1) zooms OUT to reveal more of the image. Positive (1 to 40) zooms IN to emphasize the focus area. 0 = default crop." },
      { name: "primaryCtaLabel", label: "Primary Button Label", type: "text", required: true },
      { name: "primaryCtaHref", label: "Primary Button URL", type: "url", required: true },
      { name: "secondaryCtaLabel", label: "Secondary Button Label", type: "text", required: false, hiddenOnList: true },
      { name: "secondaryCtaHref", label: "Secondary Button URL", type: "url", required: false, hiddenOnList: true },
      { name: "overlayOpacity", label: "Overlay Opacity (0 to 1)", type: "number", required: true, hiddenOnList: true },
      { name: "sortOrder", label: "Sort Order", type: "number", required: true },
      { name: "active", label: "Active", type: "boolean", required: true },
    ],
  },
  sermons: {
    module: "sermons",
    title: "Sermons",
    singular: "Sermon",
    description: "Manage past and upcoming sermons and their YouTube links.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "URL Slug", type: "slug", required: true },
      { name: "speaker", label: "Speaker", type: "text", required: true },
      { name: "sermonDate", label: "Date", type: "date", required: true },
      { name: "scripture", label: "Scripture Reference", type: "text", required: true, hiddenOnList: true },
      { name: "series", label: "Series", type: "text", required: false },
      { name: "description", label: "Description", type: "textarea", required: false, hiddenOnList: true },
      { name: "youtubeUrl", label: "YouTube URL", type: "url", required: true },
      { name: "youtubeVideoId", label: "YouTube Video ID", type: "text", required: true, hiddenOnList: true },
      { name: "thumbnailUrl", label: "Thumbnail", type: "media", required: true },
      { name: "thumbnailAlt", label: "Thumbnail Alt Text", type: "text", required: true, hiddenOnList: true },
      { name: "featured", label: "Featured", type: "boolean", required: true },
      { name: "seoTitle", label: "SEO Title", type: "text", required: false, hiddenOnList: true },
      { name: "seoDescription", label: "SEO Description", type: "textarea", required: false, hiddenOnList: true },
    ],
  },
  events: {
    module: "events",
    title: "Events",
    singular: "Event",
    description: "Manage upcoming church events and registrations.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "URL Slug", type: "slug", required: true },
      { name: "startDateTime", label: "Start Date & Time", type: "datetime", required: true },
      { name: "endDateTime", label: "End Date & Time", type: "datetime", required: true },
      { name: "location", label: "Location", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", required: false, hiddenOnList: true },
      { name: "imageUrl", label: "Event Image", type: "media", required: true },
      { name: "imageAlt", label: "Image Alt Text", type: "text", required: true, hiddenOnList: true },
      { name: "registrationUrl", label: "Registration URL", type: "url", required: false, hiddenOnList: true },
      { name: "category", label: "Category", type: "select", required: true, options: [
        { label: "Worship", value: "worship" }, { label: "Fellowship", value: "fellowship" },
        { label: "Outreach", value: "outreach" }, { label: "Youth", value: "youth" },
        { label: "Children", value: "children" }, { label: "Prayer", value: "prayer" },
        { label: "Education", value: "education" }, { label: "Music", value: "music" },
        { label: "Service", value: "service" }, { label: "Special", value: "special" }
      ]},
      { name: "recurring", label: "Recurring Event", type: "boolean", required: true, hiddenOnList: true },
      { name: "recurrenceRule", label: "Recurrence Rule", type: "text", required: false, hiddenOnList: true },
      { name: "featured", label: "Featured", type: "boolean", required: true },
      { name: "seoTitle", label: "SEO Title", type: "text", required: false, hiddenOnList: true },
      { name: "seoDescription", label: "SEO Description", type: "textarea", required: false, hiddenOnList: true },
    ],
  },
  ministries: {
    module: "ministries",
    title: "Ministries",
    singular: "Ministry",
    description: "Manage church ministries and small groups.",
    fields: [
      { name: "name", label: "Ministry Name", type: "text", required: true },
      { name: "slug", label: "URL Slug", type: "slug", required: true },
      { name: "category", label: "Category", type: "select", required: true, options: [
        { label: "Children", value: "children" }, { label: "Youth", value: "youth" },
        { label: "Adults", value: "adults" }, { label: "Family", value: "family" },
        { label: "Outreach", value: "outreach" }, { label: "Worship", value: "worship" },
        { label: "Service", value: "service" }, { label: "Education", value: "education" },
        { label: "Health", value: "health" }
      ]},
      { name: "shortDescription", label: "Short Description", type: "textarea", required: true },
      { name: "longDescription", label: "Long Description", type: "richText", required: false, hiddenOnList: true },
      { name: "leaderName", label: "Leader Name", type: "text", required: true },
      { name: "leaderEmail", label: "Leader Email", type: "email", required: true, hiddenOnList: true },
      { name: "meetingTime", label: "Meeting Time", type: "text", required: false, hiddenOnList: true },
      { name: "imageUrl", label: "Image", type: "media", required: true },
      { name: "imageAlt", label: "Image Alt Text", type: "text", required: true, hiddenOnList: true },
      { name: "ctaLabel", label: "Button Label", type: "text", required: true, hiddenOnList: true },
      { name: "ctaHref", label: "Button URL", type: "url", required: true, hiddenOnList: true },
      { name: "openInNewTab", label: "Open in New Tab", type: "boolean", required: false, defaultValue: false, hiddenOnList: true },
      { name: "featured", label: "Featured", type: "boolean", required: true },
      { name: "sortOrder", label: "Sort Order", type: "number", required: true },
      { name: "seoTitle", label: "SEO Title", type: "text", required: false, hiddenOnList: true },
      { name: "seoDescription", label: "SEO Description", type: "textarea", required: false, hiddenOnList: true },
    ],
  },
  leaders: {
    module: "leaders",
    title: "Leaders",
    singular: "Leader",
    description: "Manage church leadership staff.",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "title", label: "Job Title", type: "text", required: true },
      { name: "photoUrl", label: "Photo", type: "media", required: true },
      { name: "photoAlt", label: "Photo Alt Text", type: "text", required: true, hiddenOnList: true },
      { name: "bio", label: "Biography", type: "textarea", required: true, hiddenOnList: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "sortOrder", label: "Sort Order", type: "number", required: true },
      { name: "active", label: "Active", type: "boolean", required: true, defaultValue: true },
      // Options are injected at runtime from the leaderCategories collection
      // by app/admin/leaders/[id]/page.tsx; an empty value means Uncategorized.
      { name: "category", label: "Category", type: "select", required: false, options: [] },
    ],
  },
  leaderCategories: {
    module: "leaderCategories",
    title: "Leader Categories",
    singular: "Leader Category",
    description: "Group leaders into categories (e.g. Pastors, Elders) and order them on the public page.",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "sortOrder", label: "Sort Order", type: "number", required: true },
    ],
  },
  announcements: {
    module: "announcements",
    title: "Announcements",
    singular: "Announcement",
    description: "Manage site-wide announcements and alerts.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "body", label: "Content", type: "textarea", required: true },
      { name: "startDate", label: "Start Date", type: "date", required: true },
      { name: "endDate", label: "End Date", type: "date", required: true },
      { name: "priority", label: "Priority", type: "select", required: true, options: [
        { label: "Low", value: "low" }, { label: "Normal", value: "normal" },
        { label: "High", value: "high" }, { label: "Urgent", value: "urgent" }
      ]},
      { name: "ctaLabel", label: "Action Label", type: "text", required: false, hiddenOnList: true },
      { name: "ctaHref", label: "Action URL", type: "url", required: false, hiddenOnList: true },
      { name: "imageUrl", label: "Image", type: "media", required: false, hiddenOnList: true },
      { name: "imageAlt", label: "Image Alt Text", type: "text", required: false, hiddenOnList: true, description: "Describe the image for screen readers (required when an image is attached)." },
    ],
  },
  resources: {
    module: "resources",
    title: "Resources",
    singular: "Resource",
    description: "Manage downloadable files, forms, and external links.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "URL Slug", type: "slug", required: true },
      { name: "category", label: "Category", type: "select", required: true, options: [
        { label: "Bulletin", value: "bulletin" }, { label: "Study Guide", value: "study_guide" },
        { label: "Form", value: "form" }, { label: "Policy", value: "policy" },
        { label: "Newsletter", value: "newsletter" }, { label: "Audio", value: "audio" },
        { label: "Video", value: "video" }, { label: "Other", value: "other" }
      ]},
      { name: "description", label: "Description", type: "textarea", required: false, hiddenOnList: true },
      { name: "fileUrl", label: "File URL", type: "media", required: false },
      { name: "externalUrl", label: "External URL", type: "url", required: false },
      { name: "seoTitle", label: "SEO Title", type: "text", required: false, hiddenOnList: true },
      { name: "seoDescription", label: "SEO Description", type: "textarea", required: false, hiddenOnList: true },
    ],
  },
  pages: {
    module: "pages",
    title: "Pages",
    singular: "Page",
    description: "Manage generic content pages.",
    fields: [
      { name: "title", label: "Page Title", type: "text", required: true },
      { name: "slug", label: "URL Slug", type: "slug", required: true },
      { name: "content", label: "Page Content", type: "richText", required: true, hiddenOnList: true },
      { name: "seoTitle", label: "SEO Title", type: "text", required: false, hiddenOnList: true },
      { name: "seoDescription", label: "SEO Description", type: "textarea", required: false, hiddenOnList: true },
    ],
  },
  popups: {
    module: "popups",
    title: "Popups",
    singular: "Popup",
    description: "Site-wide popup modules (image or video) with scheduling and animation.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, description: "Internal label only; shown in lists, not on the public site." },
      { name: "mediaType", label: "Media Type", type: "select", required: true, defaultValue: "image", options: [
        { label: "Image", value: "image" },
        { label: "Video", value: "video" },
      ]},
      { name: "imageUrl", label: "Image", type: "media", required: false, hiddenOnList: true,
        description: "Required when Media Type is Image. JPG/JPEG/PNG/WEBP, 2 MB max — uploads are auto-compressed to WebP.",
        showWhen: (d) => d.mediaType !== "video" },
      { name: "imageAlt", label: "Image Alt Text", type: "text", required: false, hiddenOnList: true,
        description: "Required when an image is attached. Describes the image for screen readers.",
        showWhen: (d) => d.mediaType !== "video" },
      { name: "videoUrl", label: "Video", type: "videoUpload", required: false, hiddenOnList: true,
        description: "Upload an MP4 (≤ 25 MB) or paste a YouTube / Vimeo / direct MP4 URL. Required when Media Type is Video.",
        showWhen: (d) => d.mediaType === "video" },
      { name: "videoAutoplay", label: "Autoplay Video", type: "boolean", required: true, hiddenOnList: true,
        defaultValue: true, showWhen: (d) => d.mediaType === "video" },
      { name: "videoMuted", label: "Mute Video", type: "boolean", required: true, hiddenOnList: true,
        defaultValue: true, description: "Autoplay typically requires muted=true on modern browsers.",
        showWhen: (d) => d.mediaType === "video" },
      { name: "videoLoop", label: "Loop Video", type: "boolean", required: true, hiddenOnList: true,
        defaultValue: false, showWhen: (d) => d.mediaType === "video" },
      { name: "videoMaintain16x9", label: "Maintain 16:9 Aspect Ratio", type: "boolean", required: true, hiddenOnList: true,
        defaultValue: true, showWhen: (d) => d.mediaType === "video" },
      { name: "startTime", label: "Start Time", type: "datetime", required: false,
        description: "Leave empty for active immediately on publish. When set, the popup auto-opens during its window and no trigger element is shown." },
      { name: "endTime", label: "End Time", type: "datetime", required: false, description: "Leave empty for no expiry." },
      { name: "animationStyle", label: "Animation Style", type: "select", required: true, hiddenOnList: true,
        defaultValue: "fade-scale", options: [
          { label: "Fade-In", value: "fade" },
          { label: "Scale-Up", value: "scale" },
          { label: "Fade + Scale", value: "fade-scale" },
        ]},
      { name: "animationDurationMs", label: "Animation Duration (ms)", type: "number", required: true, hiddenOnList: true,
        defaultValue: 300, description: "100 to 2000 ms." },
      { name: "backdropStyle", label: "Backdrop Style", type: "select", required: true, hiddenOnList: true,
        defaultValue: "blur", options: [
          { label: "Solid Black", value: "solid" },
          { label: "Blur Background", value: "blur" },
          { label: "Gradient Overlay", value: "gradient" },
        ]},
      { name: "backdropOpacity", label: "Backdrop Opacity (0–1)", type: "number", required: true, hiddenOnList: true,
        defaultValue: 0.6, description: "Used by solid and gradient backdrops. 0 = transparent, 1 = fully opaque." },
      { name: "backdropBlur", label: "Backdrop Blur (px)", type: "number", required: true, hiddenOnList: true,
        defaultValue: 8, description: "Used by blur backdrop. 0–40 px." },
      { name: "widthPreset", label: "Width", type: "select", required: true, hiddenOnList: true,
        defaultValue: "auto", options: [
          { label: "Auto", value: "auto" },
          { label: "Small (400px)", value: "small" },
          { label: "Medium (700px)", value: "medium" },
          { label: "Large (90vw)", value: "large" },
        ]},
      { name: "heightPreset", label: "Height", type: "select", required: true, hiddenOnList: true,
        defaultValue: "auto", options: [
          { label: "Auto", value: "auto" },
          { label: "Fit to content", value: "fit" },
          { label: "Max height with scroll", value: "scroll" },
        ]},
      // Trigger fields are only relevant when there's no schedule. A scheduled
      // popup auto-opens during its window; the click target is the schedule
      // itself, not an on-page button/link.
      { name: "triggerType", label: "Trigger Type", type: "select", required: true, hiddenOnList: true,
        defaultValue: "button",
        showWhen: (d) => !d.startTime,
        options: [
          { label: "Click on image preview", value: "image" },
          { label: "Click on button", value: "button" },
          { label: "Click on text link", value: "link" },
        ]},
      { name: "triggerLabel", label: "Trigger Label", type: "text", required: false, hiddenOnList: true,
        description: "Label shown on the button/link trigger (ignored when trigger type is image).",
        showWhen: (d) => !d.startTime },
      { name: "captionShow", label: "Show Caption", type: "boolean", required: true, hiddenOnList: true, defaultValue: false },
      { name: "captionText", label: "Caption Text", type: "textarea", required: false, hiddenOnList: true,
        description: "Displayed below the media when 'Show Caption' is on.",
        showWhen: (d) => Boolean(d.captionShow) },
      { name: "captionAlignment", label: "Caption Alignment", type: "select", required: true, hiddenOnList: true,
        defaultValue: "center",
        showWhen: (d) => Boolean(d.captionShow),
        options: [
          { label: "Left", value: "left" },
          { label: "Center", value: "center" },
          { label: "Right", value: "right" },
        ]},
      { name: "frequencyMode", label: "Popup Frequency", type: "select", required: true, hiddenOnList: true,
        defaultValue: "every",
        description: "How often a visitor should see this popup. Frequency runs after the schedule window — popups outside their Start/End window never show, regardless of this setting.",
        options: [
          { label: "Show Every Time", value: "every" },
          { label: "Show Once per visitor", value: "once" },
          { label: "Show on Time Interval", value: "interval" },
        ]},
      { name: "frequencyIntervalValue", label: "Interval Value", type: "number", required: true, hiddenOnList: true,
        defaultValue: 1,
        description: "Numeric cooldown between displays.",
        showWhen: (d) => d.frequencyMode === "interval" },
      { name: "frequencyIntervalUnit", label: "Interval Unit", type: "select", required: true, hiddenOnList: true,
        defaultValue: "days",
        showWhen: (d) => d.frequencyMode === "interval",
        options: [
          { label: "Minutes", value: "minutes" },
          { label: "Hours", value: "hours" },
          { label: "Days", value: "days" },
        ]},
    ],
  },
};
