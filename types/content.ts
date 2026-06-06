import type { AuditFields, ContentStatus, FirestoreTimestampLike } from "./shared";
import type { PageBuilderDocument } from "./pageBuilder";

export type HomepageSlide = AuditFields & {
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  imageAlignment?: string;
  focalPointZoom?: number;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
  overlayOpacity: number;
  sortOrder: number;
  active: boolean;
  status: ContentStatus;
  publishedAt: FirestoreTimestampLike;
};

export type Sermon = AuditFields & {
  title: string;
  slug: string;
  speaker: string;
  sermonDate: FirestoreTimestampLike;
  scripture: string;
  series: string | null;
  description: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  featured: boolean;
  status: ContentStatus;
  seoTitle: string;
  seoDescription: string;
  isLive?: boolean;
};

export type EventCategory =
  | "worship"
  | "fellowship"
  | "outreach"
  | "youth"
  | "children"
  | "prayer"
  | "education"
  | "music"
  | "service"
  | "special";

export type ChurchEvent = AuditFields & {
  title: string;
  slug: string;
  startDateTime: FirestoreTimestampLike;
  // When `endsNever` is true the event is treated as ongoing and `endDateTime`
  // may be null. Validators and renderers must guard against that.
  endDateTime: FirestoreTimestampLike | null;
  endsNever?: boolean;
  location: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  registrationUrl: string | null;
  // Defaults to true (existing behavior) when undefined. Set false to keep
  // the Register button in the same tab.
  registrationOpenInNewTab?: boolean;
  recurring: boolean;
  recurrenceRule: string | null;
  // Optional per-recurrence time overrides ("HH:MM" 24h). When set, computed
  // future occurrences use these times instead of the main startDateTime /
  // endDateTime time-of-day. Leave unset to inherit the main times.
  recurrenceStartTime?: string | null;
  recurrenceEndTime?: string | null;
  category: EventCategory;
  featured: boolean;
  status: ContentStatus;
  seoTitle: string;
  seoDescription: string;
};

export type MinistryCategory =
  | "children"
  | "youth"
  | "adults"
  | "family"
  | "outreach"
  | "worship"
  | "service"
  | "education"
  | "health";

export type Ministry = AuditFields & {
  name: string;
  slug: string;
  category: MinistryCategory;
  shortDescription: string;
  longDescription: string;
  leaderName: string;
  leaderEmail: string;
  meetingTime: string;
  imageUrl: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  openInNewTab?: boolean;
  featured: boolean;
  status: ContentStatus;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
};

export type Leader = {
  name: string;
  title: string;
  photoUrl: string;
  photoAlt: string;
  bio: string;
  email: string;
  sortOrder: number;
  active: boolean;
  category?: string; // category id; empty/missing = Uncategorized
  // When true, this leader is shown in the homepage Welcome section. Up to two
  // flagged leaders render there, ordered by sortOrder. If none are flagged,
  // the section falls back to the top two active leaders.
  featuredOnHomepage?: boolean;
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
};

export type LeaderCategory = {
  name: string;
  sortOrder: number;
  createdAt?: FirestoreTimestampLike;
  updatedAt?: FirestoreTimestampLike;
};

export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";

export type Announcement = {
  title: string;
  body: string;
  startDate: FirestoreTimestampLike;
  endDate: FirestoreTimestampLike;
  priority: AnnouncementPriority;
  ctaLabel: string | null;
  ctaHref: string | null;
  // When true the Action URL opens in a new browser tab with safe rel attrs.
  openInNewTab?: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
  status: ContentStatus;
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
};

export type ResourceCategory =
  | "bulletin"
  | "study_guide"
  | "form"
  | "policy"
  | "newsletter"
  | "audio"
  | "video"
  | "other";

export type Resource = {
  title: string;
  slug: string;
  category: ResourceCategory;
  description: string;
  fileUrl: string | null;
  externalUrl: string | null;
  status: ContentStatus;
  seoTitle: string;
  seoDescription: string;
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
};

export type PageSection = {
  type: "hero" | "richText" | "imageText" | "cards" | "cta";
  heading: string | null;
  body: string | null;
  imageUrl: string | null;
  href: string | null;
  cta: string | null;
};

export type PageContent = {
  title: string;
  slug: string;
  content: string;
  sections: PageSection[];
  builderData?: PageBuilderDocument;
  seoTitle: string;
  seoDescription: string;
  status: ContentStatus;
  // Optional back-link rendered above the builder content
  // (e.g. "← Back to Home"). Disabled by default.
  backLinkEnabled?: boolean;
  backLinkHref?: string;
  backLinkLabel?: string;
  // Optional dark-navy hero banner at the very top of the page (matches the
  // hardcoded /about, /our-beliefs, /resources pattern). Disabled by default.
  heroEnabled?: boolean;
  heroSubtitle?: string;
  heroImageUrl?: string;
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
};
