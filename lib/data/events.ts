import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import type { ChurchEvent } from "@/types/content";
import { PUBLISHED } from "@/types/shared";
import { nextOccurrence } from "@/lib/recurrence";
import { logDataFallback, serializeData, withReadTimeout, type Serialized } from "./utils";

const SITEMAP_PAST_EVENT_GRACE_DAYS = 30;

function applyTimeOverride(date: Date, timeOverride: string | null | undefined): Date {
  if (!timeOverride) return date;
  const m = timeOverride.match(/^(\d{2}):(\d{2})$/);
  if (!m) return date;
  const out = new Date(date);
  out.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return out;
}

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

    // Fetch all published events ordered by original start. We need to consider
    // recurring events whose original startDateTime is in the past but whose
    // next occurrence is still upcoming, so we cannot rely on the Firestore
    // `>= now` filter alone — we filter in memory below.
    const snapshot = await withReadTimeout(
      db
        .collection(collections.events)
        .where("status", "==", PUBLISHED)
        .orderBy("startDateTime", "asc")
        .get(),
    );

    const items: { event: Serialized<ChurchEvent>; effectiveStart: number }[] = [];

    for (const doc of snapshot.docs) {
      const raw = serializeData({
        id: doc.id,
        ...doc.data(),
      } as unknown as ChurchEvent);

      const start = raw.startDateTime ? new Date(raw.startDateTime) : null;
      if (!start || Number.isNaN(start.getTime())) continue;

      if (start >= now) {
        items.push({ event: raw, effectiveStart: start.getTime() });
        continue;
      }

      // Recurring event with a past anchor — find the next occurrence and
      // shift start/end so the card surfaces the upcoming instance instead of
      // the original one. Non-recurring past events drop out.
      if (raw.recurring === true && raw.recurrenceRule) {
        const next = nextOccurrence(raw.recurrenceRule, start, now);
        if (!next) continue;
        const end = raw.endDateTime ? new Date(raw.endDateTime as string) : null;
        const hasValidEnd = end !== null && !Number.isNaN(end.getTime());
        const durationMs = hasValidEnd ? end!.getTime() - start.getTime() : 0;

        // Apply per-recurrence time overrides ("HH:MM") if set; otherwise the
        // next occurrence keeps the anchor's time-of-day.
        const shiftedStart = applyTimeOverride(next, raw.recurrenceStartTime);
        let shiftedEnd: Date | null = hasValidEnd
          ? new Date(shiftedStart.getTime() + durationMs)
          : null;
        if (shiftedEnd && raw.recurrenceEndTime) {
          shiftedEnd = applyTimeOverride(shiftedEnd, raw.recurrenceEndTime);
        }

        const shifted: Serialized<ChurchEvent> = {
          ...raw,
          startDateTime: shiftedStart.toISOString(),
          endDateTime: shiftedEnd ? shiftedEnd.toISOString() : raw.endDateTime,
        };
        items.push({ event: shifted, effectiveStart: shiftedStart.getTime() });
      }
    }

    items.sort((a, b) => a.effectiveStart - b.effectiveStart);

    const sliced = typeof limit === "number" ? items.slice(0, limit) : items;
    return sliced.map((i) => i.event);
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
