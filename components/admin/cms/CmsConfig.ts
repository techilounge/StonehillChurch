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
  | "richText"
  | "recurrence";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  section?: string;
  required?: boolean;
  description?: string;
  /**
   * Short help text shown in an info-icon tooltip next to the field label.
   * Use for one-sentence hints (e.g. "Defaults to the start date if blank").
   * Longer guidance still belongs in `description`, which renders inline
   * below the label.
   */
  tooltip?: string;
  /**
   * Longer help text shown in a click-to-open popover next to the field label.
   * Takes precedence over `tooltip` when both are set. Use for explanations
   * that need multiple sentences or wouldn't read well as a hover tooltip.
   */
  popover?: string;
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
      { name: "title", label: "Title", type: "text", required: true, tooltip: "Large heading shown over the slide." },
      { name: "subtitle", label: "Subtitle", type: "textarea", required: false, hiddenOnList: true, tooltip: "Smaller handwritten-style text shown above the title." },
      { name: "imageUrl", label: "Background Image", type: "media", required: true, tooltip: "Full-bleed hero image. Landscape orientation works best." },
      { name: "imageAlt", label: "Image Alt Text", type: "text", required: true, hiddenOnList: true, tooltip: "Describes the image for screen readers." },
      { name: "imageAlignment", label: "Image Focus Area", type: "select", required: true, hiddenOnList: true, tooltip: "Which part of the image stays visible when the slide is cropped on smaller screens.", options: [
        { label: "Center", value: "center" },
        { label: "Top", value: "top" },
        { label: "Bottom", value: "bottom" },
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
        { label: "Top Center", value: "top center" },
        { label: "Bottom Center", value: "bottom center" }
      ]},
      { name: "focalPointZoom", label: "Focal Zoom (%)", type: "number", required: false, hiddenOnList: true, popover: "Fine-tune the crop without re-uploading the image.\n\n• 0 = default crop\n• 1 to 40 zooms IN, emphasizing the focus area\n• −40 to −1 zooms OUT, revealing more of the image around the focus point" },
      { name: "primaryCtaLabel", label: "Primary Button Label", type: "text", required: true, tooltip: "Text on the main call-to-action button (e.g. \"Plan Your Visit\")." },
      { name: "primaryCtaHref", label: "Primary Button URL", type: "url", required: true, tooltip: "Where the primary button sends visitors." },
      { name: "secondaryCtaLabel", label: "Secondary Button Label", type: "text", required: false, hiddenOnList: true, tooltip: "Optional second button label. Leave blank to hide the secondary button." },
      { name: "secondaryCtaHref", label: "Secondary Button URL", type: "url", required: false, hiddenOnList: true, tooltip: "Where the secondary button sends visitors." },
      { name: "overlayOpacity", label: "Overlay Opacity (0 to 1)", type: "number", required: true, hiddenOnList: true, tooltip: "Darkens the image so light text stays readable. 0 = none, 1 = solid." },
      { name: "sortOrder", label: "Sort Order", type: "number", required: true, tooltip: "Lower numbers show first in the hero carousel rotation." },
      { name: "active", label: "Active", type: "boolean", required: true, tooltip: "Inactive slides are skipped without being deleted." },
    ],
  },
  sermons: {
    module: "sermons",
    title: "Sermons",
    singular: "Sermon",
    description: "Manage past and upcoming sermons and their YouTube links.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "URL Slug", type: "slug", required: true, tooltip: "URL path on the public site, e.g. /sermons/your-slug." },
      { name: "speaker", label: "Speaker", type: "text", required: true, tooltip: "Person who delivered the sermon." },
      { name: "sermonDate", label: "Date", type: "date", required: true, tooltip: "Date the sermon was preached." },
      { name: "scripture", label: "Scripture Reference", type: "text", required: true, hiddenOnList: true, tooltip: "Bible passage, e.g. \"Romans 8:1–11\"." },
      { name: "series", label: "Series", type: "text", required: false, tooltip: "Optional sermon series name (e.g. \"Walk by Faith\")." },
      { name: "description", label: "Description", type: "textarea", required: false, hiddenOnList: true, tooltip: "Short summary shown on the sermon card and detail page." },
      { name: "youtubeUrl", label: "YouTube URL", type: "url", required: true, tooltip: "Full link to the YouTube video (e.g. https://youtu.be/...)." },
      { name: "youtubeVideoId", label: "YouTube Video ID", type: "text", required: true, hiddenOnList: true, tooltip: "The 11-character ID from the YouTube URL. Used for embedding." },
      { name: "thumbnailUrl", label: "Thumbnail", type: "media", required: true, tooltip: "Preview image for the sermon card. YouTube's auto-thumbnail is also acceptable." },
      { name: "thumbnailAlt", label: "Thumbnail Alt Text", type: "text", required: true, hiddenOnList: true, tooltip: "Describes the thumbnail for screen readers." },
      { name: "featured", label: "Featured", type: "boolean", required: true, tooltip: "Featured sermons are highlighted on the homepage Latest Sermon section." },
      { name: "seoTitle", label: "SEO Title", type: "text", required: false, hiddenOnList: true, tooltip: "Browser tab and search-result title. Falls back to the sermon title if blank." },
      { name: "seoDescription", label: "SEO Description", type: "textarea", required: false, hiddenOnList: true, tooltip: "Search-result snippet. Aim for 150–160 characters." },
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
      { name: "startDateTime", label: "Start Date & Time", type: "datetime", required: true, tooltip: "When this event (or its first instance, if recurring) begins." },
      {
        name: "endsNever",
        label: "Event has no end date",
        type: "boolean",
        required: false,
        defaultValue: false,
        description: "Enable for ongoing events that don't have a defined end. Hides the End Date & Time field.",
        tooltip: "Use for ongoing events with no defined end (e.g. perpetual ministries).",
      },
      {
        name: "endDateTime",
        label: "End Date & Time",
        type: "datetime",
        required: true,
        showWhen: (data) => data.endsNever !== true,
        tooltip: "When a single occurrence wraps up. Sets the duration shown on event cards.",
      },
      { name: "location", label: "Location", type: "text", required: true, tooltip: "Free-text address or venue, e.g. \"Stonehill Fellowship Hall\"." },
      { name: "description", label: "Description", type: "textarea", required: false, hiddenOnList: true, tooltip: "Shown on the public event page below the title." },
      { name: "imageUrl", label: "Event Image", type: "media", required: true, tooltip: "Hero image for the event card and detail page. Pick from the Media library or upload a new one." },
      { name: "imageAlt", label: "Image Alt Text", type: "text", required: true, hiddenOnList: true, tooltip: "Describes the image for screen readers and when it fails to load." },
      { name: "registrationUrl", label: "Registration URL", type: "url", required: false, hiddenOnList: true, tooltip: "Where the Register button on the event detail page sends visitors. Leave blank to hide the button." },
      {
        name: "registrationOpenInNewTab",
        label: "Open Registration Link in New Tab",
        type: "boolean",
        required: false,
        defaultValue: true,
        hiddenOnList: true,
        description: "Enable this to open the Registration URL in a new browser tab.",
        showWhen: (data) =>
          typeof data.registrationUrl === "string" && data.registrationUrl.trim().length > 0,
        tooltip: "On: registration opens in a new browser tab. Off: stays in the same tab.",
      },
      { name: "category", label: "Category", type: "select", required: true, tooltip: "Used to filter and color-code events on the public Events page.", options: [
        { label: "Worship", value: "worship" }, { label: "Fellowship", value: "fellowship" },
        { label: "Outreach", value: "outreach" }, { label: "Youth", value: "youth" },
        { label: "Children", value: "children" }, { label: "Prayer", value: "prayer" },
        { label: "Education", value: "education" }, { label: "Music", value: "music" },
        { label: "Service", value: "service" }, { label: "Special", value: "special" }
      ]},
      { name: "recurring", label: "Recurring Event", type: "boolean", required: true, hiddenOnList: true, tooltip: "Turn on to repeat this event on a schedule (daily, weekly, etc.)." },
      {
        name: "recurrenceRule",
        label: "Recurrence",
        type: "recurrence",
        required: false,
        hiddenOnList: true,
        description: "Pick a preset (Daily, Weekly, Monthly…) and the RRULE is generated for you.",
        showWhen: (data) => data.recurring === true,
        tooltip: "Choose a preset; the schedule rule is generated automatically.",
      },
      { name: "featured", label: "Featured", type: "boolean", required: true, tooltip: "Highlights this event in featured sections (e.g. priority placement on listings)." },
      { name: "seoTitle", label: "SEO Title", type: "text", required: false, hiddenOnList: true, tooltip: "Browser tab and search-result title. Falls back to the event title if blank. Aim for ≤ 70 chars." },
      { name: "seoDescription", label: "SEO Description", type: "textarea", required: false, hiddenOnList: true, tooltip: "Search-result snippet. Aim for 150–160 characters." },
    ],
  },
  ministries: {
    module: "ministries",
    title: "Ministries",
    singular: "Ministry",
    description: "Manage church ministries and small groups.",
    fields: [
      { name: "name", label: "Ministry Name", type: "text", required: true },
      { name: "slug", label: "URL Slug", type: "slug", required: true, tooltip: "URL path on the public site, e.g. /ministries/your-slug." },
      { name: "category", label: "Category", type: "select", required: true, tooltip: "Used to filter and group ministries on the public Ministries page.", options: [
        { label: "Children", value: "children" }, { label: "Youth", value: "youth" },
        { label: "Adults", value: "adults" }, { label: "Family", value: "family" },
        { label: "Outreach", value: "outreach" }, { label: "Worship", value: "worship" },
        { label: "Service", value: "service" }, { label: "Education", value: "education" },
        { label: "Health", value: "health" }
      ]},
      { name: "shortDescription", label: "Short Description", type: "textarea", required: true, tooltip: "1–2 sentences shown on the ministry card." },
      { name: "longDescription", label: "Long Description", type: "richText", required: false, hiddenOnList: true, tooltip: "Full description shown on the ministry detail page." },
      { name: "leaderName", label: "Leader Name", type: "text", required: true, tooltip: "Person responsible for this ministry; displayed publicly." },
      { name: "leaderEmail", label: "Leader Email", type: "email", required: true, hiddenOnList: true, tooltip: "Contact email for the ministry leader." },
      { name: "meetingTime", label: "Meeting Time", type: "text", required: false, hiddenOnList: true, tooltip: "Free-text, e.g. \"Sabbaths at 9:30 AM\" or \"Every other Tuesday\"." },
      { name: "imageUrl", label: "Image", type: "media", required: true, tooltip: "Hero image for the ministry card and detail page." },
      { name: "imageAlt", label: "Image Alt Text", type: "text", required: true, hiddenOnList: true, tooltip: "Describes the image for screen readers." },
      { name: "ctaLabel", label: "Button Label", type: "text", required: true, hiddenOnList: true, tooltip: "Text on the call-to-action button (e.g. \"Join us\")." },
      { name: "ctaHref", label: "Button URL", type: "url", required: true, hiddenOnList: true, tooltip: "Where the call-to-action button sends visitors." },
      { name: "openInNewTab", label: "Open in New Tab", type: "boolean", required: false, defaultValue: false, hiddenOnList: true, tooltip: "On: button opens in a new browser tab. Off: stays in the same tab." },
      { name: "featured", label: "Featured", type: "boolean", required: true, tooltip: "Featured ministries appear in the homepage Ministries preview." },
      { name: "sortOrder", label: "Sort Order", type: "number", required: true, tooltip: "Lower numbers appear first on the Ministries page." },
      { name: "seoTitle", label: "SEO Title", type: "text", required: false, hiddenOnList: true, tooltip: "Browser tab and search-result title. Falls back to the ministry name if blank." },
      { name: "seoDescription", label: "SEO Description", type: "textarea", required: false, hiddenOnList: true, tooltip: "Search-result snippet. Aim for 150–160 characters." },
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
      { name: "photoUrl", label: "Photo", type: "media", required: true, tooltip: "Headshot shown on /our-leaders. Square images crop best inside the circular frame." },
      { name: "photoAlt", label: "Photo Alt Text", type: "text", required: true, hiddenOnList: true, tooltip: "Describes the photo for screen readers (e.g. \"Pastor John Smith\")." },
      { name: "bio", label: "Biography", type: "textarea", required: true, hiddenOnList: true, tooltip: "Short bio shown in the leader's details modal on the public site." },
      { name: "email", label: "Email", type: "email", required: true, tooltip: "Contact email shown on the leader's card." },
      { name: "sortOrder", label: "Sort Order", type: "number", required: true, tooltip: "Lower numbers appear first within the leader's category." },
      { name: "active", label: "Active", type: "boolean", required: true, defaultValue: true, tooltip: "Inactive leaders are hidden from the public site but kept in the CMS." },
      {
        name: "featuredOnHomepage",
        label: "Featured on Homepage",
        type: "boolean",
        required: false,
        defaultValue: false,
        description:
          "Show this leader in the homepage Welcome section. The first two flagged leaders (by Sort Order) are displayed.",
        tooltip: "Pins this leader to the homepage Welcome section (max two, ordered by Sort Order).",
      },
      // Options are injected at runtime from the leaderCategories collection
      // by app/admin/leaders/[id]/page.tsx; an empty value means Uncategorized.
      { name: "category", label: "Category", type: "select", required: false, options: [], tooltip: "Group leaders under a section heading on /our-leaders. Leave blank for Uncategorized." },
    ],
  },
  leaderCategories: {
    module: "leaderCategories",
    title: "Leader Categories",
    singular: "Leader Category",
    description: "Group leaders into categories (e.g. Pastors, Elders) and order them on the public page.",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, tooltip: "Heading shown above this group on the public Leaders page." },
      { name: "sortOrder", label: "Sort Order", type: "number", required: true, tooltip: "Lower numbers appear first on the public page." },
    ],
  },
  announcements: {
    module: "announcements",
    title: "Announcements",
    singular: "Announcement",
    description: "Manage site-wide announcements and alerts.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, section: "Basic Content" },
      { name: "slug", label: "URL Slug", type: "slug", required: true, section: "Basic Content", description: "Used for the announcement's future public URL. Suggested automatically from the title and editable before saving.", tooltip: "Lowercase letters, numbers, and hyphens only." },
      { name: "summary", label: "Summary", type: "textarea", required: false, section: "Basic Content", defaultValue: "", description: "A concise preview of the announcement, up to 300 characters. If left blank, a summary is derived from the content." },
      { name: "body", label: "Content", type: "textarea", required: true, section: "Basic Content" },
      { name: "category", label: "Category", type: "select", required: true, section: "Basic Content", defaultValue: "general", options: [
        { label: "General", value: "general" },
        { label: "Worship", value: "worship" },
        { label: "Ministry", value: "ministry" },
        { label: "School", value: "school" },
        { label: "Community", value: "community" },
        { label: "Prayer", value: "prayer" },
        { label: "Health", value: "health" },
        { label: "Service", value: "service" },
        { label: "Special", value: "special" },
        { label: "Other", value: "other" },
      ]},
      { name: "imageUrl", label: "Image", type: "media", required: false, section: "Basic Content", hiddenOnList: true, tooltip: "Optional thumbnail shown with the announcement where supported." },
      { name: "imageAlt", label: "Image Alt Text", type: "text", required: false, section: "Basic Content", hiddenOnList: true, description: "Describe the image for screen readers (required when an image is attached).", tooltip: "Required when an image is attached. Describes it for screen readers." },
      { name: "startDate", label: "Start Date", type: "date", required: true, section: "Display Window", tooltip: "First day the announcement can appear on time-sensitive surfaces." },
      { name: "endDate", label: "End Date", type: "date", required: true, section: "Display Window", tooltip: "Last day the announcement can appear on time-sensitive surfaces." },
      { name: "priority", label: "Priority", type: "select", required: true, section: "Display Window", defaultValue: "normal", tooltip: "Sets banner color and stacking order. Urgent shows first and in red.", options: [
        { label: "Low", value: "low" }, { label: "Normal", value: "normal" },
        { label: "High", value: "high" }, { label: "Urgent", value: "urgent" }
      ]},
      { name: "publishToWebsite", label: "Publish to Website", type: "boolean", required: false, section: "Website Placement", defaultValue: true, description: "Make this announcement available on the public Announcements section." },
      { name: "showInAnnouncementBar", label: "Show in Site-wide Announcement Bar", type: "boolean", required: false, section: "Website Placement", defaultValue: true, description: "Display this announcement in the rotating alert bar while it is active." },
      { name: "showOnHomepage", label: "Feature on Homepage", type: "boolean", required: false, section: "Website Placement", defaultValue: false, description: "Allow this announcement to appear in homepage news or announcement features." },
      { name: "ctaLabel", label: "Action Label", type: "text", required: false, section: "Call to Action", hiddenOnList: true, tooltip: "Text shown on the action button (e.g. \"Learn more\")." },
      { name: "ctaHref", label: "Action URL", type: "url", required: false, section: "Call to Action", hiddenOnList: true, tooltip: "Where the action button sends visitors. An action label is required when this is set." },
      {
        name: "openInNewTab",
        label: "Open Action URL in New Tab",
        type: "boolean",
        required: false,
        section: "Call to Action",
        defaultValue: false,
        hiddenOnList: true,
        description: "Enable this to open the Action URL in a new browser tab.",
        tooltip: "On: action opens in a new browser tab. Off: stays in the same tab.",
      },
      { name: "seoTitle", label: "SEO Title", type: "text", required: false, section: "SEO", defaultValue: "", hiddenOnList: true, description: "Optional search-result title, up to 70 characters." },
      { name: "seoDescription", label: "SEO Description", type: "textarea", required: false, section: "SEO", defaultValue: "", hiddenOnList: true, description: "Optional search-result description, up to 160 characters." },
    ],
  },
  resources: {
    module: "resources",
    title: "Resources",
    singular: "Resource",
    description: "Manage downloadable files, forms, and external links.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "URL Slug", type: "slug", required: true, tooltip: "URL path on the public site, e.g. /resources/your-slug." },
      { name: "category", label: "Category", type: "select", required: true, tooltip: "Used to group and filter resources on the public Resources page.", options: [
        { label: "Bulletin", value: "bulletin" }, { label: "Study Guide", value: "study_guide" },
        { label: "Form", value: "form" }, { label: "Policy", value: "policy" },
        { label: "Newsletter", value: "newsletter" }, { label: "Audio", value: "audio" },
        { label: "Video", value: "video" }, { label: "Other", value: "other" }
      ]},
      { name: "description", label: "Description", type: "textarea", required: false, hiddenOnList: true, tooltip: "Short blurb shown on the resource card." },
      { name: "fileUrl", label: "File URL", type: "media", required: false, tooltip: "Upload the file (PDF, audio, etc.) or paste a hosted URL. Use this OR External URL." },
      { name: "externalUrl", label: "External URL", type: "url", required: false, tooltip: "Link to an external page (e.g. Google Drive, Vimeo). Use this OR File URL." },
      { name: "seoTitle", label: "SEO Title", type: "text", required: false, hiddenOnList: true, tooltip: "Browser tab and search-result title. Falls back to the resource title if blank." },
      { name: "seoDescription", label: "SEO Description", type: "textarea", required: false, hiddenOnList: true, tooltip: "Search-result snippet. Aim for 150–160 characters." },
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
        popover: "How often a returning visitor should see this popup.\n\n• Every Time — shows on every page load that matches the trigger\n• Once per Visitor — shows once, then never again for that browser\n• On Time Interval — re-shows after a cooldown you set below\n\nFrequency runs after the schedule window. Popups outside their Start/End window never show, regardless of this setting.",
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
