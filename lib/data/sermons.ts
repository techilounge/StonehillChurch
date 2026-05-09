import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections, PUBLISHED } from "@/lib/firestore";
import type { Sermon } from "@/types/content";
import { serializeData, type Serialized } from "./utils";

const db = getAdminFirestore();

export async function getSermons(): Promise<Serialized<Sermon>[]> {
  const snapshot = await db
    .collection(collections.sermons)
    .where("status", "==", PUBLISHED)
    .orderBy("sermonDate", "desc")
    .get();

  return snapshot.docs.map((doc) => serializeData({ id: doc.id, ...doc.data() } as Sermon));
}

export async function getSermonBySlug(slug: string): Promise<Serialized<Sermon> | null> {
  const snapshot = await db
    .collection(collections.sermons)
    .where("status", "==", PUBLISHED)
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return serializeData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Sermon);
}

export async function getLatestSermon(): Promise<Serialized<Sermon> | null> {
  const snapshot = await db
    .collection(collections.sermons)
    .where("status", "==", PUBLISHED)
    .orderBy("sermonDate", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return serializeData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Sermon);
}
