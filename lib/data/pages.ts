import "server-only";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import type { PageContent } from "@/types/content";
import { PUBLISHED } from "@/types/shared";
import { logDataFallback, serializeData, withReadTimeout, type Serialized } from "./utils";

export async function getPageBySlug(slug: string): Promise<Serialized<PageContent> | null> {
  try {
    const db = getAdminFirestore();
    const pagesRef = db.collection(collections.pages);
    const snapshot = await withReadTimeout(
      pagesRef
        .where("slug", "==", slug)
        .where("status", "==", PUBLISHED)
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
  } catch (error) {
    logDataFallback("getPageBySlug", error);
    return null;
  }
}
