import type { FirestoreTimestampLike } from "./shared";

export type SiteSettingsGroup =
  | "general"
  | "contact"
  | "social"
  | "giving"
  | "service_times"
  | "seo"
  | "design"
  | "notifications";

// Global spacing scale exposed to the Page Builder via CSS custom properties
// (`--pb-space-${name}`). Admins edit these in Site Settings → Design Tokens;
// updating a value flows through every section/row/column that references the
// token.
export type SpacingTokenName = "xs" | "sm" | "md" | "lg" | "xl";

export type SpacingTokens = Record<SpacingTokenName, number>;

export const DEFAULT_SPACING_TOKENS: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 32,
  xl: 64,
};

export const SPACING_TOKEN_NAMES: SpacingTokenName[] = ["xs", "sm", "md", "lg", "xl"];

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

export type YoutubeSettingsConfig = Omit<YoutubeSettings, "updatedAt" | "updatedBy">;

export type HomepageSlidesHeightConfig = {
  mode: "default" | "preset" | "custom";
  preset: "small" | "medium" | "large" | "fullscreen";
  customValue: string;
  unit: "px" | "%" | "vh";
};

export type HomepageSlidesConfig = {
  height: HomepageSlidesHeightConfig;
};

export const DEFAULT_HOMEPAGE_SLIDES_CONFIG: HomepageSlidesConfig = {
  height: {
    mode: "default",
    preset: "medium",
    customValue: "600",
    unit: "px",
  },
};
