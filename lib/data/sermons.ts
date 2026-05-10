import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections, PUBLISHED } from "@/lib/firestore";
import type { Sermon } from "@/types/content";
import { serializeData, withReadTimeout, type Serialized } from "./utils";

export async function getSermons(): Promise<Serialized<Sermon>[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.sermons)
        .where("status", "==", PUBLISHED)
        .orderBy("sermonDate", "desc")
        .get(),
    );

    return snapshot.docs.map((doc) =>
      serializeData({ id: doc.id, ...doc.data() } as unknown as Sermon),
    );
  } catch {
    return [];
  }
}

export async function getSermonBySlug(slug: string): Promise<Serialized<Sermon> | null> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.sermons)
        .where("status", "==", PUBLISHED)
        .where("slug", "==", slug)
        .limit(1)
        .get(),
    );

    if (snapshot.empty) return null;
    return serializeData(
      { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as Sermon,
    );
  } catch {
    return null;
  }
}

export async function getLatestSermon(): Promise<Serialized<Sermon> | null> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.sermons)
        .where("status", "==", PUBLISHED)
        .orderBy("sermonDate", "desc")
        .limit(1)
        .get(),
    );

    if (snapshot.empty) return null;
    return serializeData(
      { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as Sermon,
    );
  } catch {
    return null;
  }
}
