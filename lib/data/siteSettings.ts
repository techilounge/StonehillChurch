import "server-only";

import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import type { SiteSettingDoc } from "@/types/settings";
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

  return "";
}

export async function getSiteSettings(): Promise<SiteSettingsMap> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(db.collection(collections.siteSettings).get());
    const flatSettings: SiteSettingsMap = {};
    const groupedSettings: SiteSettingsMap = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data() as SiteSettingDoc;
      const key = typeof data.key === "string" && data.key.trim() ? data.key.trim() : doc.id;

      if (isPlainObject(data.value)) {
        Object.entries(data.value).forEach(([field, value]) => {
          groupedSettings[`${key}.${field}`] = settingValueToString(value);
        });
        return;
      }

      flatSettings[key] = settingValueToString(data.value);
    });

    return { ...flatSettings, ...groupedSettings };
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
