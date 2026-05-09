import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/firestore";

const db = getAdminFirestore();

export async function getYoutubeSettings(): Promise<Record<string, any>> {
  const snapshot = await db.collection(collections.youtubeSettings).get();
  const settings: Record<string, any> = {};
  
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    settings[data.key || doc.id] = data.value ?? data;
  });

  return settings;
}
