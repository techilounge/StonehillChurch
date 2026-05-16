import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import { isPopupActiveAt } from "@/lib/popup/scheduling";
import type { Popup } from "@/types/popup";
import { PUBLISHED } from "@/types/shared";
import { serializeData, type Serialized } from "./utils";

/**
 * Resolve the single active popup for the public site, applying scheduling
 * rules:
 *   - status must be "published"
 *   - if startTime is set and now < startTime → not active
 *   - if endTime is set and now > endTime → not active
 *
 * Returns the most recently created active popup, or null when none are
 * active. Wrapped in try/catch so a Firestore outage degrades to "no popup"
 * rather than breaking the public layout.
 */
export async function getActivePopup(): Promise<Serialized<Popup> | null> {
  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection(collections.popups)
      .where("status", "==", PUBLISHED)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    if (snapshot.empty) return null;

    const now = Date.now();

    for (const doc of snapshot.docs) {
      const popup = serializeData({ id: doc.id, ...doc.data() } as unknown as Popup);
      if (!isPopupActiveAt({ startTime: popup.startTime, endTime: popup.endTime }, now)) {
        continue;
      }
      return popup;
    }

    return null;
  } catch (error) {
    console.error("[popups] getActivePopup failed:", error);
    return null;
  }
}
