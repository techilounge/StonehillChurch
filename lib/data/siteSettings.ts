import "server-only";

import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import {
  DEFAULT_SPACING_TOKENS,
  SPACING_TOKEN_NAMES,
  DEFAULT_HOMEPAGE_SLIDES_CONFIG,
  DEFAULT_MEDIA_SETTINGS,
  type SiteSettingDoc,
  type SpacingTokens,
  type HomepageSlidesConfig,
  type MediaSettings,
} from "@/types/settings";
import { logDataFallback, withReadTimeout } from "./utils";

export type SiteSettingsMap = Record<string, string>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function settingValueToString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === "string").join(",");
  }

  return "";
}

function flattenSettingValue(
  prefix: string,
  value: unknown,
  flatSettings: Record<string, string>,
) {
  if (value === null || typeof value === "undefined") {
    flatSettings[prefix] = "";
    return;
  }

  if (Array.isArray(value)) {
    flatSettings[prefix] = value.filter((v) => typeof v === "string").join(",");
    return;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([field, val]) => {
      flattenSettingValue(`${prefix}.${field}`, val, flatSettings);
    });
    return;
  }

  flatSettings[prefix] = settingValueToString(value);
}

type RawSiteSettingEntry = {
  id: string;
  key?: unknown;
  value: unknown;
};

/**
 * Flatten raw siteSettings documents so grouped CMS documents (e.g. "contact",
 * "service_times") always take precedence over legacy dotted seed documents
 * (e.g. "contact.address") regardless of Firestore document ID sort order.
 */
export function flattenSiteSettingDocs(entries: RawSiteSettingEntry[]): SiteSettingsMap {
  const flatSettings: SiteSettingsMap = {};
  const normalized = entries.map((entry) => ({
    key: typeof entry.key === "string" && entry.key.trim() ? entry.key.trim() : entry.id,
    value: entry.value,
  }));

  // Pass 1: legacy dotted keys; Pass 2: canonical grouped documents override them.
  for (const isGroupedPass of [false, true]) {
    for (const entry of normalized) {
      if (entry.key.includes(".") === isGroupedPass) continue;
      flattenSettingValue(entry.key, entry.value, flatSettings);
    }
  }

  return flatSettings;
}

export async function getSiteSettings(): Promise<SiteSettingsMap> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(db.collection(collections.siteSettings).get());
    const entries = snapshot.docs.map((doc) => {
      const data = doc.data() as SiteSettingDoc;
      return {
        id: doc.id,
        key: data.key,
        value: data.value,
      };
    });

    return flattenSiteSettingDocs(entries);
  } catch (error) {
    logDataFallback("getSiteSettings", error);
    return {};
  }
}

export const getCachedSiteSettings = unstable_cache(
  getSiteSettings,
  ["site-settings", "flattened"],
  {
    revalidate: 300,
    tags: ["site-settings"],
  },
);

/**
 * Reads the configured global Page Builder spacing tokens (XS/SM/MD/LG/XL).
 * Returns the defaults when nothing has been saved or any field is invalid,
 * so callers always get a complete token set. Values are integer pixel sizes.
 */
export async function getSpacingTokens(): Promise<SpacingTokens> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db.collection(collections.siteSettings).where("key", "==", "design").limit(1).get(),
    );
    if (snapshot.empty) return { ...DEFAULT_SPACING_TOKENS };
    const data = snapshot.docs[0].data() as SiteSettingDoc;
    const value = isPlainObject(data.value) ? (data.value as Record<string, unknown>) : null;
    const raw = value && isPlainObject(value.spacing_tokens) ? (value.spacing_tokens as Record<string, unknown>) : null;
    if (!raw) return { ...DEFAULT_SPACING_TOKENS };

    const tokens: SpacingTokens = { ...DEFAULT_SPACING_TOKENS };
    for (const name of SPACING_TOKEN_NAMES) {
      const v = raw[name];
      const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
      if (Number.isFinite(n) && n >= 0 && n <= 500) tokens[name] = Math.round(n);
    }
    return tokens;
  } catch (error) {
    logDataFallback("getSpacingTokens", error);
    return { ...DEFAULT_SPACING_TOKENS };
  }
}

export const getCachedSpacingTokens = unstable_cache(
  getSpacingTokens,
  ["site-settings", "spacing-tokens"],
  { revalidate: 300, tags: ["site-settings"] },
);

/**
 * Reads the configured global Homepage Carousel slide height configuration.
 * Returns defaults when nothing has been saved or any field is invalid.
 */
export async function getHomepageSlidesConfig(): Promise<HomepageSlidesConfig> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db.collection(collections.siteSettings).where("key", "==", "homepageSlides").limit(1).get()
    );
    
    if (snapshot.empty) return { ...DEFAULT_HOMEPAGE_SLIDES_CONFIG };
    const data = snapshot.docs[0].data() as SiteSettingDoc;
    const value = isPlainObject(data.value) ? (data.value as Record<string, unknown>) : null;
    const rawHeight = value && isPlainObject(value.height) ? (value.height as Record<string, unknown>) : null;
    if (!rawHeight) return { ...DEFAULT_HOMEPAGE_SLIDES_CONFIG };

    return {
      height: {
        mode: (rawHeight.mode as any) || "default",
        preset: (rawHeight.preset as any) || "medium",
        customValue: typeof rawHeight.customValue === "string" ? rawHeight.customValue : "600",
        unit: (rawHeight.unit as any) || "px",
      },
    };
  } catch (error) {
    logDataFallback("getHomepageSlidesConfig", error);
    return { ...DEFAULT_HOMEPAGE_SLIDES_CONFIG };
  }
}

export const getCachedHomepageSlidesConfig = unstable_cache(
  getHomepageSlidesConfig,
  ["site-settings", "homepage-slides-config"],
  { revalidate: 300, tags: ["site-settings"] },
);

/**
 * Reads the configured global Media default aspect ratios.
 * Returns defaults when nothing has been saved or any field is invalid.
 */
export async function getMediaSettings(): Promise<MediaSettings> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db.collection(collections.siteSettings).where("key", "==", "media").limit(1).get()
    );
    
    if (snapshot.empty) return { ...DEFAULT_MEDIA_SETTINGS };
    const data = snapshot.docs[0].data() as SiteSettingDoc;
    const value = isPlainObject(data.value) ? (data.value as Record<string, unknown>) : null;
    const rawRatios = value && isPlainObject(value.defaultRatios) ? (value.defaultRatios as Record<string, unknown>) : null;
    if (!rawRatios) return { ...DEFAULT_MEDIA_SETTINGS };

    return {
      defaultRatios: {
        ministries: (rawRatios.ministries as any) || "auto",
        homepageSlides: (rawRatios.homepageSlides as any) || "auto",
        pageBuilder: (rawRatios.pageBuilder as any) || "auto",
        resources: (rawRatios.resources as any) || "auto",
      },
    };
  } catch (error) {
    logDataFallback("getMediaSettings", error);
    return { ...DEFAULT_MEDIA_SETTINGS };
  }
}

export const getCachedMediaSettings = unstable_cache(
  getMediaSettings,
  ["site-settings", "media-settings"],
  { revalidate: 300, tags: ["site-settings"] },
);
