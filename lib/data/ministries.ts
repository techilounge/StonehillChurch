import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections, PUBLISHED } from "@/lib/firestore";
import type { Ministry } from "@/types/content";
import { serializeData, type Serialized } from "./utils";

const db = getAdminFirestore();

export async function getMinistries(): Promise<Serialized<Ministry>[]> {
  const snapshot = await db
    .collection(collections.ministries)
    .where("status", "==", PUBLISHED)
    .orderBy("sortOrder", "asc")
    .get();

  return snapshot.docs.map((doc) => serializeData({ id: doc.id, ...doc.data() } as Ministry));
}

export async function getFeaturedMinistries(limit?: number): Promise<Serialized<Ministry>[]> {
  let query = db
    .collection(collections.ministries)
    .where("status", "==", PUBLISHED)
    .where("featured", "==", true)
    .orderBy("sortOrder", "asc");

  if (limit) {
    query = query.limit(limit);
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => serializeData({ id: doc.id, ...doc.data() } as Ministry));
}

export async function getMinistryBySlug(slug: string): Promise<Serialized<Ministry> | null> {
  const snapshot = await db
    .collection(collections.ministries)
    .where("status", "==", PUBLISHED)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return serializeData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Ministry);
}
