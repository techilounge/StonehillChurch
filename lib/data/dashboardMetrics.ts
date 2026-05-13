import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import { PUBLISHED } from "@/types/shared";

export type DashboardMetrics = {
  sermonsPublished: number | null;
  eventsUpcoming: number | null;
  ministriesActive: number | null;
  formSubmissionsPending: number | null;
  announcementsActive: number | null;
  mediaAssetsTotal: number | null;
};

async function countOrNull(label: string, run: () => Promise<number>): Promise<number | null> {
  try {
    return await run();
  } catch (error) {
    console.error(`[dashboardMetrics] ${label} count failed:`, error);
    return null;
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const db = getAdminFirestore();
  const now = new Date();

  const [
    sermonsPublished,
    eventsUpcoming,
    ministriesActive,
    formSubmissionsPending,
    announcementsActive,
    mediaAssetsTotal,
  ] = await Promise.all([
    countOrNull("sermonsPublished", async () => {
      const snap = await db
        .collection(collections.sermons)
        .where("status", "==", PUBLISHED)
        .count()
        .get();
      return snap.data().count;
    }),
    countOrNull("eventsUpcoming", async () => {
      const snap = await db
        .collection(collections.events)
        .where("status", "==", PUBLISHED)
        .where("startDateTime", ">=", now)
        .count()
        .get();
      return snap.data().count;
    }),
    countOrNull("ministriesActive", async () => {
      const snap = await db
        .collection(collections.ministries)
        .where("status", "==", PUBLISHED)
        .count()
        .get();
      return snap.data().count;
    }),
    countOrNull("formSubmissionsPending", async () => {
      const snap = await db
        .collection(collections.formSubmissions)
        .where("status", "==", "new")
        .count()
        .get();
      return snap.data().count;
    }),
    countOrNull("announcementsActive", async () => {
      // Firestore supports only one inequality per query, so we filter by
      // endDate >= now here. Past-start filtering happens at render time
      // when the value is consumed; for the dashboard metric this upper-bound
      // count is sufficient.
      const snap = await db
        .collection(collections.announcements)
        .where("status", "==", PUBLISHED)
        .where("endDate", ">=", now)
        .count()
        .get();
      return snap.data().count;
    }),
    countOrNull("mediaAssetsTotal", async () => {
      const snap = await db.collection(collections.mediaAssets).count().get();
      return snap.data().count;
    }),
  ]);

  return {
    sermonsPublished,
    eventsUpcoming,
    ministriesActive,
    formSubmissionsPending,
    announcementsActive,
    mediaAssetsTotal,
  };
}
