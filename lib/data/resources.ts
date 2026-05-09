import "server-only";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { Resource } from "@/types/content";
import { serializeData, Serialized } from "./utils";

export async function getResources(): Promise<Serialized<Resource>[]> {
  const db = getAdminFirestore();
  const resourcesRef = db.collection("resources");
  const snapshot = await resourcesRef
    .where("status", "==", "published")
    .orderBy("createdAt", "desc")
    .get();

  const resources = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Resource[];

  return resources.map(serializeData);
}

export async function getBulletins(): Promise<Serialized<Resource>[]> {
  const db = getAdminFirestore();
  const resourcesRef = db.collection("resources");
  const snapshot = await resourcesRef
    .where("status", "==", "published")
    .where("category", "==", "bulletin")
    .orderBy("createdAt", "desc")
    .get();

  const bulletins = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Resource[];

  return bulletins.map(serializeData);
}
