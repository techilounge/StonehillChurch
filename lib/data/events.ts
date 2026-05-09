import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections, PUBLISHED } from "@/lib/firestore";
import type { ChurchEvent } from "@/types/content";
import { serializeData, type Serialized } from "./utils";

const db = getAdminFirestore();

export async function getUpcomingEvents(limit?: number): Promise<Serialized<ChurchEvent>[]> {
  const now = new Date();
  let query = db
    .collection(collections.events)
    .where("status", "==", PUBLISHED)
    .where("startDateTime", ">=", now)
    .orderBy("startDateTime", "asc");

  if (limit) {
    query = query.limit(limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => serializeData({ id: doc.id, ...doc.data() } as ChurchEvent));
}

export async function getEventBySlug(slug: string): Promise<Serialized<ChurchEvent> | null> {
  const snapshot = await db
    .collection(collections.events)
    .where("status", "==", PUBLISHED)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return serializeData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as ChurchEvent);
}
