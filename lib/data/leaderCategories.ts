import "server-only";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import type { LeaderCategory } from "@/types/content";
import { logDataFallback, serializeData, withReadTimeout, type Serialized } from "./utils";

export async function getLeaderCategories(): Promise<Serialized<LeaderCategory>[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db.collection(collections.leaderCategories).orderBy("sortOrder", "asc").get(),
    );

    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as LeaderCategory[];

    return categories.map(serializeData);
  } catch (error) {
    logDataFallback("getLeaderCategories", error);
    return [];
  }
}
