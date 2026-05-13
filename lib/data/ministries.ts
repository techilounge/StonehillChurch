import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import type { Ministry } from "@/types/content";
import { PUBLISHED } from "@/types/shared";
import { logDataFallback, serializeData, withReadTimeout, type Serialized } from "./utils";

export async function getMinistries(): Promise<Serialized<Ministry>[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.ministries)
        .where("status", "==", PUBLISHED)
        .orderBy("sortOrder", "asc")
        .get(),
    );

    return snapshot.docs.map((doc) =>
      serializeData({ id: doc.id, ...doc.data() } as unknown as Ministry),
    );
  } catch (error) {
    logDataFallback("getMinistries", error);
    return [];
  }
}

export async function getFeaturedMinistries(limit?: number): Promise<Serialized<Ministry>[]> {
  try {
    const db = getAdminFirestore();
    let query = db
      .collection(collections.ministries)
      .where("status", "==", PUBLISHED)
      .where("featured", "==", true)
      .orderBy("sortOrder", "asc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await withReadTimeout(query.get());
    return snapshot.docs.map((doc) =>
      serializeData({ id: doc.id, ...doc.data() } as unknown as Ministry),
    );
  } catch (error) {
    logDataFallback("getFeaturedMinistries", error);
    return [];
  }
}

export async function getMinistryBySlug(slug: string): Promise<Serialized<Ministry> | null> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.ministries)
        .where("status", "==", PUBLISHED)
        .where("slug", "==", slug)
        .limit(1)
        .get(),
    );

    if (snapshot.empty) return null;
    return serializeData(
      { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as Ministry,
    );
  } catch (error) {
    logDataFallback("getMinistryBySlug", error);
    return null;
  }
}
