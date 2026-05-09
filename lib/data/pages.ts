import "server-only";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { PageContent } from "@/types/content";
import { serializeData, Serialized } from "./utils";

export async function getPageBySlug(slug: string): Promise<Serialized<PageContent> | null> {
  const db = getAdminFirestore();
  const pagesRef = db.collection("pages");
  const snapshot = await pagesRef
    .where("slug", "==", slug)
    .where("status", "==", "published")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const page = {
    id: doc.id,
    ...doc.data()
  } as PageContent;

  return serializeData(page);
}
