import "server-only";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import type { Leader } from "@/types/content";
import { logDataFallback, serializeData, withReadTimeout, type Serialized } from "./utils";

export async function getLeaders(): Promise<Serialized<Leader>[]> {
  try {
    const db = getAdminFirestore();
    const leadersRef = db.collection(collections.leaders);
    const snapshot = await withReadTimeout(
      leadersRef
        .where("active", "==", true)
        .orderBy("sortOrder", "asc")
        .get(),
    );

    const leaders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Leader[];

    return leaders.map(serializeData);
  } catch (error) {
    logDataFallback("getLeaders", error);
    return [];
  }
}
