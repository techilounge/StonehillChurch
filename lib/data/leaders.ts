import "server-only";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type { Leader } from "@/types/content";
import { serializeData, withReadTimeout, type Serialized } from "./utils";

export async function getLeaders(): Promise<Serialized<Leader>[]> {
  try {
    const db = getAdminFirestore();
    const leadersRef = db.collection("leaders");
    const snapshot = await withReadTimeout(
      leadersRef
        .where("status", "==", "published")
        .orderBy("order", "asc")
        .get(),
    );

    const leaders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Leader[];

    return leaders.map(serializeData);
  } catch {
    return [];
  }
}
