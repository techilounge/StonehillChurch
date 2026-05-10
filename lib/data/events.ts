import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections, PUBLISHED } from "@/lib/firestore";
import type { ChurchEvent } from "@/types/content";
import { serializeData, withReadTimeout, type Serialized } from "./utils";

export async function getUpcomingEvents(limit?: number): Promise<Serialized<ChurchEvent>[]> {
  try {
    const db = getAdminFirestore();
    const now = new Date();
    let query = db
      .collection(collections.events)
      .where("status", "==", PUBLISHED)
      .where("startDateTime", ">=", now)
      .orderBy("startDateTime", "asc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await withReadTimeout(query.get());
    return snapshot.docs.map((doc) =>
      serializeData({ id: doc.id, ...doc.data() } as unknown as ChurchEvent),
    );
  } catch {
    return [];
  }
}

export async function getPublishedEventsForSitemap(): Promise<Serialized<ChurchEvent>[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.events)
        .where("status", "==", PUBLISHED)
        .orderBy("startDateTime", "desc")
        .get(),
    );

    return snapshot.docs.map((doc) =>
      serializeData({ id: doc.id, ...doc.data() } as unknown as ChurchEvent),
    );
  } catch {
    return [];
  }
}

export async function getEventBySlug(slug: string): Promise<Serialized<ChurchEvent> | null> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.events)
        .where("status", "==", PUBLISHED)
        .where("slug", "==", slug)
        .limit(1)
        .get(),
    );

    if (snapshot.empty) return null;
    return serializeData(
      { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as ChurchEvent,
    );
  } catch {
    return null;
  }
}
