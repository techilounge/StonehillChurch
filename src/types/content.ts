import type { FirestoreDate, PublishableFields } from "./shared";

export type HomepageSlide = PublishableFields & {
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
};

export type Sermon = PublishableFields & {
  title: string;
  slug: string;
  speaker: string;
  sermonDate: FirestoreDate;
  description: string;
  youtubeUrl: string;
  audioUrl: string;
  thumbnailUrl: string;
};

export type ChurchEvent = PublishableFields & {
  title: string;
  slug: string;
  startsAt: FirestoreDate;
  endsAt: FirestoreDate;
  location: string;
  description: string;
  imageUrl: string;
};

export type Ministry = PublishableFields & {
  title: string;
  slug: string;
  description: string;
  leaderName: string;
  contactEmail: string;
  imageUrl: string;
};

export type Leader = PublishableFields & {
  name: string;
  roleTitle: string;
  bio: string;
  imageUrl: string;
  email: string;
};

export type Announcement = PublishableFields & {
  title: string;
  body: string;
  startsAt: FirestoreDate;
  endsAt: FirestoreDate;
};

export type Resource = PublishableFields & {
  title: string;
  description: string;
  fileUrl: string;
  category: string;
};

export type PageContent = PublishableFields & {
  title: string;
  slug: string;
  body: string;
};

