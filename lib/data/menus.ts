import "server-only";

import { unstable_cache } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import { menuDocumentSchema } from "@/lib/validators";
import type { AdminSession } from "@/lib/auth";
import type { MenuLocation, MenuItem } from "@/types/menus";
import { logDataFallback, withReadTimeout } from "./utils";

const MENU_DOC_IDS: Record<MenuLocation, string> = {
  header: "header",
  footer: "footer",
};

export async function getMenuByLocation(
  location: MenuLocation,
): Promise<MenuItem[]> {
  try {
    const db = getAdminFirestore();
    const doc = await withReadTimeout(
      db.collection(collections.menus).doc(MENU_DOC_IDS[location]).get(),
    );

    if (!doc.exists) {
      return [];
    }

    const data = doc.data();
    return Array.isArray(data?.items) ? (data.items as MenuItem[]) : [];
  } catch (error) {
    logDataFallback(`getMenuByLocation(${location})`, error);
    return [];
  }
}

export async function getAllMenus(): Promise<{
  header: MenuItem[];
  footer: MenuItem[];
}> {
  const [header, footer] = await Promise.all([
    getMenuByLocation("header"),
    getMenuByLocation("footer"),
  ]);
  return { header, footer };
}

export const getCachedMenus = unstable_cache(
  getAllMenus,
  ["menus", "all"],
  {
    revalidate: 300,
    tags: ["menus"],
  },
);

export async function saveMenu(
  location: MenuLocation,
  items: MenuItem[],
  actor: AdminSession,
): Promise<void> {
  const parsed = menuDocumentSchema.safeParse({ location, items });

  if (!parsed.success) {
    throw new Error(
      `Invalid menu data: ${parsed.error.flatten().fieldErrors ? JSON.stringify(parsed.error.flatten().fieldErrors) : parsed.error.message}`,
    );
  }

  const db = getAdminFirestore();
  await db
    .collection(collections.menus)
    .doc(MENU_DOC_IDS[location])
    .set(
      {
        location,
        items: parsed.data.items,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: actor.uid,
      },
      { merge: false },
    );
}
