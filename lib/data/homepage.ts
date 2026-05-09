import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections, SINGLETON_DOCS, PUBLISHED } from "@/lib/firestore";
import type {
  HomepageSlide,
  Sermon,
  ChurchEvent,
  Ministry,
  Announcement,
} from "@/types/content";
import type { SiteSettingsGroup, SiteSettingDoc } from "@/types/settings";

import { serializeData, type Serialized } from "./utils";

const db = getAdminFirestore();

export async function getHomepageSlides(): Promise<Serialized<HomepageSlide>[]> {
  const snapshot = await db
    .collection(collections.homepageSlides)
    .where("status", "==", PUBLISHED)
    .where("active", "==", true)
    .orderBy("sortOrder", "asc")
    .get();

  return snapshot.docs.map((doc) => serializeData({ id: doc.id, ...doc.data() } as HomepageSlide));
}

export async function getActiveAnnouncements(): Promise<Serialized<Announcement>[]> {
  const now = new Date();
  
  // Firestore inequalities can only be applied to one field.
  // We'll filter start/end dates in memory to keep the query simple, 
  // or query where endDate >= now and filter startDate in memory.
  const snapshot = await db
    .collection(collections.announcements)
    .where("status", "==", PUBLISHED)
    .where("endDate", ">=", now)
    .get();

  const active = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as Announcement))
    .filter((a) => {
      // Ensure it has started
      if (!a.startDate) return false;
      const start = typeof a.startDate === "string" ? new Date(a.startDate) : (a.startDate as any).toDate();
      return start <= now;
    })
    .map(serializeData);

  return active;
}






