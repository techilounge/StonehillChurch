import type { FirestoreTimestampLike } from "./shared";

export type SiteSettingsGroup =
  | "general"
  | "contact"
  | "social"
  | "giving"
  | "service_times"
  | "seo";

export type SiteSettingValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | Record<string, string | number | boolean | null>;

export type SiteSettingDoc = {
  key: string;
  value: SiteSettingValue;
  group: SiteSettingsGroup;
  updatedAt: FirestoreTimestampLike;
  updatedBy: string | null;
};

export type YoutubeSettings = {
  channelId: string;
  channelUrl: string;
  liveStreamUrl: string | null;
  uploadsPlaylistId: string | null;
  featuredVideoId: string | null;
  autoFetchLatestSermons: boolean;
  showLiveBanner: boolean;
  updatedAt: FirestoreTimestampLike;
  updatedBy: string | null;
};
