import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import type { ChurchEvent } from "@/types/content";
import { PUBLISHED } from "@/types/shared";
import { logDataFallback, serializeData, withReadTimeout, type Serialized } from "./utils";

const SITEMAP_PAST_EVENT_GRACE_DAYS = 30;

function dateFromValue(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "object" && value && "toDate" in value) {
    const timestamp = value as { toDate?: () => Date };
    return typeof timestamp.toDate === "function" ? dateFromValue(timestamp.toDate()) : null;
  }

  return null;
}

export async function getUpcomingEvents(limit?: number): Promise<Serialized<ChurchEvent>[]> {
  try {
    const db = getAdminFirestore();
    const now = new Date();
    let query = db
      .collection(collections.events)
      .where("status", "==", PUBLISHED)
      .where("startDateTime", ">=", now)
      .orderBy("startDateTime", "asc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await withReadTimeout(query.get());
    return snapshot.docs.map((doc) =>
      serializeData({ id: doc.id, ...doc.data() } as unknown as ChurchEvent),
    );
  } catch (error) {
    logDataFallback("getUpcomingEvents", error);
    return [];
  }
}

export async function getPublishedEventsForSitemap(): Promise<Serialized<ChurchEvent>[]> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.events)
        .where("status", "==", PUBLISHED)
        .orderBy("startDateTime", "desc")
        .get(),
    );

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - SITEMAP_PAST_EVENT_GRACE_DAYS);

    return snapshot.docs
      .map((doc) => serializeData({ id: doc.id, ...doc.data() } as unknown as ChurchEvent))
      .filter((event) => {
        const eventEnd = dateFromValue(event.endDateTime) ?? dateFromValue(event.startDateTime);
        return eventEnd ? eventEnd >= cutoff : true;
      });
  } catch (error) {
    logDataFallback("getPublishedEventsForSitemap", error);
    return [];
  }
}

export async function getEventBySlug(slug: string): Promise<Serialized<ChurchEvent> | null> {
  try {
    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.events)
        .where("status", "==", PUBLISHED)
        .where("slug", "==", slug)
        .limit(1)
        .get(),
    );

    if (snapshot.empty) return null;
    return serializeData(
      { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as ChurchEvent,
    );
  } catch (error) {
    logDataFallback("getEventBySlug", error);
    return null;
  }
}
