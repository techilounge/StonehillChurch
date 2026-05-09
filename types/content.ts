import type { AuditFields, ContentStatus, FirestoreTimestampLike } from "./shared";

export type HomepageSlide = AuditFields & {
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
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
  endDateTime: FirestoreTimestampLike;
  location: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  registrationUrl: string | null;
  recurring: boolean;
  recurrenceRule: string | null;
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
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
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
  seoTitle: string;
  seoDescription: string;
  status: ContentStatus;
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
};
