import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/firestore";
import type { SiteSettingDoc } from "@/types/settings";

const db = getAdminFirestore();

export async function getSiteSettings(): Promise<Record<string, any>> {
  const snapshot = await db.collection(collections.siteSettings).get();
  const settings: Record<string, any> = {};
  
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as SiteSettingDoc;
    settings[data.key] = data.value;
  });

  return settings;
}
