import "server-only";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { Leader } from "@/types/content";
import { serializeData, Serialized } from "./utils";

export async function getLeaders(): Promise<Serialized<Leader>[]> {
  const db = getAdminFirestore();
  const leadersRef = db.collection("leaders");
  const snapshot = await leadersRef
    .where("status", "==", "published")
    .orderBy("order", "asc")
    .get();

  const leaders = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Leader[];

  return leaders.map(serializeData);
}
