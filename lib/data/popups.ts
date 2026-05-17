import "server-only";

import { unstable_noStore as noStore } from "next/cache";
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
  // Opt out of Next.js's Full Route / Data caches. The parent (public) layout
  // declares `revalidate = 300`, which otherwise bakes the popup HTML into a
  // 5-minute cache window — so a popup whose endTime falls *inside* that
  // window will keep being served past its expiry until the next revalidation
  // tick. noStore() makes the route segment dynamic for this fetch only,
  // while site-settings reads (already memoized via getCachedSiteSettings)
  // keep their own caching layer.
  noStore();
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
