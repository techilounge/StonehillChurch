import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import { PUBLISHED } from "@/types/shared";
import type {
  HomepageSlide,
} from "@/types/content";
import {
  normalizeAnnouncement,
  type NormalizedAnnouncement,
} from "@/lib/announcements";

import { logDataFallback, serializeData, withReadTimeout, type Serialized } from "./utils";

export type { Serialized } from "./utils";

export async function getHomepageSlides(): Promise<Serialized<HomepageSlide>[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.homepageSlides)
        .where("status", "==", PUBLISHED)
        .where("active", "==", true)
        .orderBy("sortOrder", "asc")
        .get(),
    );

    return snapshot.docs.map((doc) =>
      serializeData({ id: doc.id, ...doc.data() } as unknown as HomepageSlide),
    );
  } catch (error) {
    logDataFallback("getHomepageSlides", error);
    return [];
  }
}

const ANNOUNCEMENT_PRIORITY_ORDER: Record<NormalizedAnnouncement["priority"], number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

async function loadActiveAnnouncements(): Promise<NormalizedAnnouncement[]> {
  const db = getAdminFirestore();
  const now = new Date();

  // Firestore inequalities can only be applied to one field, so the query
  // narrows by endDate and the start boundary is checked after normalization.
  const snapshot = await withReadTimeout(
    db
      .collection(collections.announcements)
      .where("status", "==", PUBLISHED)
      .where("endDate", ">=", now)
      .get(),
  );

  return snapshot.docs
    .map((doc) =>
      normalizeAnnouncement({ id: doc.id, ...doc.data() }),
    )
    .filter((announcement) => {
      const start = toDate(announcement.startDate);
      const end = toDate(announcement.endDate);
      return Boolean(start && end && start <= now && end >= now);
    });
}

export async function getActiveAnnouncements(): Promise<Serialized<NormalizedAnnouncement>[]> {
  try {
    return (await loadActiveAnnouncements())
      .filter(
        (announcement) =>
          announcement.publishToWebsite && announcement.showInAnnouncementBar,
      )
      .map(serializeData);
  } catch (error) {
    logDataFallback("getActiveAnnouncements", error);
    return [];
  }
}

export async function getHomepageAnnouncements(
  limit = 3,
): Promise<Serialized<NormalizedAnnouncement>[]> {
  try {
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 12);
    return (await loadActiveAnnouncements())
      .filter(
        (announcement) =>
          announcement.publishToWebsite && announcement.showOnHomepage,
      )
      .sort((left, right) => {
        const priorityDifference =
          ANNOUNCEMENT_PRIORITY_ORDER[right.priority] -
          ANNOUNCEMENT_PRIORITY_ORDER[left.priority];
        if (priorityDifference !== 0) return priorityDifference;
        return (toDate(right.startDate)?.getTime() ?? 0) -
          (toDate(left.startDate)?.getTime() ?? 0);
      })
      .slice(0, safeLimit)
      .map(serializeData);
  } catch (error) {
    logDataFallback("getHomepageAnnouncements", error);
    return [];
  }
}
