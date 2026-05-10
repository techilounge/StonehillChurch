import "server-only";

import { unstable_cache } from "next/cache";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/firestore";
import type { SiteSettingDoc } from "@/types/settings";
import { withReadTimeout } from "./utils";

export async function getSiteSettings(): Promise<Record<string, any>> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(db.collection(collections.siteSettings).get());
    const settings: Record<string, any> = {};
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data() as SiteSettingDoc;
      settings[data.key] = data.value;
    });

    return settings;
  } catch {
    return {};
  }
}

export const getCachedSiteSettings = unstable_cache(
  getSiteSettings,
  ["site-settings"],
  {
    revalidate: 300,
    tags: ["site-settings"],
  },
);
