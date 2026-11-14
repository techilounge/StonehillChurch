import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import { PUBLISHED } from "@/types/shared";
import type {
  HomepageSlide,
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
