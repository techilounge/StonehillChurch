import "server-only";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type { PageContent } from "@/types/content";
import { serializeData, withReadTimeout, type Serialized } from "./utils";

export async function getPageBySlug(slug: string): Promise<Serialized<PageContent> | null> {
  try {
    const db = getAdminFirestore();
    const pagesRef = db.collection("pages");
    const snapshot = await withReadTimeout(
      pagesRef
        .where("slug", "==", slug)
        .where("status", "==", "published")
        .limit(1)
        .get(),
    );

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const page = {
      id: doc.id,
      ...doc.data(),
    } as unknown as PageContent;

    return serializeData(page);
  } catch {
    return null;
  }
}
