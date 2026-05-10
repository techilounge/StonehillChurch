import "server-only";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type { Resource } from "@/types/content";
import { serializeData, withReadTimeout, type Serialized } from "./utils";

export async function getResources(): Promise<Serialized<Resource>[]> {
  try {
    const db = getAdminFirestore();
    const resourcesRef = db.collection("resources");
    const snapshot = await withReadTimeout(
      resourcesRef
        .where("status", "==", "published")
        .orderBy("createdAt", "desc")
        .get(),
    );

    const resources = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Resource[];

    return resources.map(serializeData);
  } catch {
    return [];
  }
}

export async function getBulletins(): Promise<Serialized<Resource>[]> {
  try {
    const db = getAdminFirestore();
    const resourcesRef = db.collection("resources");
    const snapshot = await withReadTimeout(
      resourcesRef
        .where("status", "==", "published")
        .where("category", "==", "bulletin")
        .orderBy("createdAt", "desc")
        .get(),
    );

    const bulletins = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Resource[];

    return bulletins.map(serializeData);
  } catch {
    return [];
  }
}
