import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import { PUBLISHED } from "@/types/shared";
import type {
  HomepageSlide,
  Announcement,
} from "@/types/content";

import { logDataFallback, serializeData, withReadTimeout, type Serialized } from "./utils";

export type { Serialized } from "./utils";

export async function getHomepageSlides(): Promise<Serialized<HomepageSlide>[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.homepageSlides)
        .where("status", "==", PUBLISHED)
        .where("active", "==", true)
        .orderBy("sortOrder", "asc")
        .get(),
    );

    return snapshot.docs.map((doc) =>
      serializeData({ id: doc.id, ...doc.data() } as unknown as HomepageSlide),
    );
  } catch (error) {
    logDataFallback("getHomepageSlides", error);
    return [];
  }
}

export async function getActiveAnnouncements(): Promise<Serialized<Announcement>[]> {
  try {
    const db = getAdminFirestore();
    const now = new Date();
    
    // Firestore inequalities can only be applied to one field.
    // We'll filter start/end dates in memory to keep the query simple, 
    // or query where endDate >= now and filter startDate in memory.
    const snapshot = await withReadTimeout(
      db
        .collection(collections.announcements)
        .where("status", "==", PUBLISHED)
        .where("endDate", ">=", now)
        .get(),
    );

    const active = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as unknown as Announcement))
      .filter((announcement) => {
        if (!announcement.startDate) return false;
        const timestampLike = announcement.startDate as { toDate?: () => Date };
        const start =
          typeof announcement.startDate === "string"
            ? new Date(announcement.startDate)
            : announcement.startDate instanceof Date
              ? announcement.startDate
              : typeof timestampLike.toDate === "function"
                ? timestampLike.toDate()
                : null;
        return Boolean(start && start <= now);
      })
      .map(serializeData);

    return active;
  } catch (error) {
    logDataFallback("getActiveAnnouncements", error);
    return [];
  }
}
