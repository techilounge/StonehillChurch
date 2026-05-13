import "server-only";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import type { Resource } from "@/types/content";
import { PUBLISHED } from "@/types/shared";
import { logDataFallback, serializeData, withReadTimeout, type Serialized } from "./utils";

export async function getResources(): Promise<Serialized<Resource>[]> {
  try {
    const db = getAdminFirestore();
    const resourcesRef = db.collection(collections.resources);
    const snapshot = await withReadTimeout(
      resourcesRef
        .where("status", "==", PUBLISHED)
        .orderBy("createdAt", "desc")
        .get(),
    );

    const resources = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Resource[];

    return resources.map(serializeData);
  } catch (error) {
    logDataFallback("getResources", error);
    return [];
  }
}

export async function getBulletins(): Promise<Serialized<Resource>[]> {
  try {
    const db = getAdminFirestore();
    const resourcesRef = db.collection(collections.resources);
    const snapshot = await withReadTimeout(
      resourcesRef
        .where("status", "==", PUBLISHED)
        .where("category", "==", "bulletin")
        .orderBy("createdAt", "desc")
        .get(),
    );

    const bulletins = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Resource[];

    return bulletins.map(serializeData);
  } catch (error) {
    logDataFallback("getBulletins", error);
    return [];
  }
}
