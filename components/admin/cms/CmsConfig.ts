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
};
