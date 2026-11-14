import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import { PUBLISHED } from "@/types/shared";
import {
  compareAnnouncementsForDisplay,
  getAnnouncementWindow,
  isAnnouncementActive,
  normalizeAnnouncement,
  ANNOUNCEMENT_END_GRACE_MS,
  type NormalizedAnnouncement,
} from "@/lib/announcements";

import { logDataFallback, serializeData, withReadTimeout, type Serialized } from "./utils";

export type PublicAnnouncement = Serialized<NormalizedAnnouncement>;

/** Upper bound on legacy documents scanned when a slug field is missing. */
const LEGACY_SLUG_SCAN_LIMIT = 200;

async function loadActiveAnnouncements(now = new Date()): Promise<NormalizedAnnouncement[]> {
  const db = getAdminFirestore();

  // Firestore inequalities can only be applied to one field, so the query
  // narrows by endDate and the start boundary is checked after normalization.
  // End dates are stored as the start of the last display day, so the query
  // looks back one day and the precise inclusive check happens in memory.
  const snapshot = await withReadTimeout(
    db
      .collection(collections.announcements)
      .where("status", "==", PUBLISHED)
      .where("endDate", ">=", new Date(now.getTime() - ANNOUNCEMENT_END_GRACE_MS))
      .get(),
  );

  return snapshot.docs
    .map((doc) => normalizeAnnouncement({ id: doc.id, ...doc.data() }))
    .filter((announcement) => isAnnouncementActive(announcement, now));
}

/** Active announcements for the site-wide rotating announcement bar. */
export async function getAnnouncementBarItems(): Promise<PublicAnnouncement[]> {
  try {
    return (await loadActiveAnnouncements())
      .filter((a) => a.publishToWebsite && a.showInAnnouncementBar)
      .sort(compareAnnouncementsForDisplay)
      .map(serializeData);
  } catch (error) {
    logDataFallback("getAnnouncementBarItems", error);
    return [];
  }
}

/** Active announcements an editor chose to feature on the homepage. */
export async function getHomepageAnnouncements(limit = 3): Promise<PublicAnnouncement[]> {
  try {
    const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 12);
    return (await loadActiveAnnouncements())
      .filter((a) => a.publishToWebsite && a.showOnHomepage)
      .sort(compareAnnouncementsForDisplay)
      .slice(0, safeLimit)
      .map(serializeData);
  } catch (error) {
    logDataFallback("getHomepageAnnouncements", error);
    return [];
  }
}

/** Every active announcement published to the website, for /announcements. */
export async function getPublicAnnouncements(): Promise<PublicAnnouncement[]> {
  try {
    return (await loadActiveAnnouncements())
      .filter((a) => a.publishToWebsite)
      .sort(compareAnnouncementsForDisplay)
      .map(serializeData);
  } catch (error) {
    logDataFallback("getPublicAnnouncements", error);
    return [];
  }
}

export type AnnouncementDetail = {
  announcement: PublicAnnouncement;
  /** True once the display window has closed; the page stays reachable. */
  hasEnded: boolean;
};

/**
 * Looks up a published, website-visible announcement by slug. Announcements
 * that have not started yet are hidden; ended ones stay reachable (so shared
 * links keep working) but are flagged so the page can say so and opt out of
 * indexing.
 */
export async function getAnnouncementBySlug(slug: string): Promise<AnnouncementDetail | null> {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;

  try {
    const collection = getAdminFirestore().collection(collections.announcements);
    const bySlug = await withReadTimeout(
      collection.where("slug", "==", slug).where("status", "==", PUBLISHED).limit(1).get(),
    );

    let raw: Record<string, unknown> | null = bySlug.docs[0]
      ? { id: bySlug.docs[0].id, ...bySlug.docs[0].data() }
      : null;

    if (!raw) {
      // Legacy documents predate the slug field; their slug is derived from
      // the title at read time, so match against the normalized value.
      const legacy = await withReadTimeout(
        collection.where("status", "==", PUBLISHED).limit(LEGACY_SLUG_SCAN_LIMIT).get(),
      );
      const match = legacy.docs.find(
        (doc) =>
          typeof doc.get("slug") !== "string" &&
          normalizeAnnouncement({ id: doc.id, ...doc.data() }).slug === slug,
      );
      raw = match ? { id: match.id, ...match.data() } : null;
    }

    if (!raw) return null;

    const announcement: NormalizedAnnouncement = normalizeAnnouncement(raw);
    if (!announcement.publishToWebsite) return null;

    const now = new Date();
    const { start, end } = getAnnouncementWindow(announcement);
    if (!start || start > now) return null;

    return {
      announcement: serializeData(announcement),
      hasEnded: Boolean(end && end < now),
    };
  } catch (error) {
    logDataFallback("getAnnouncementBySlug", error);
    return null;
  }
}
