import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { SINGLETON_DOCS, collections } from "@/lib/constants/collections";
import type { YoutubeSettings, YoutubeSettingsConfig } from "@/types/settings";
import { logDataFallback, withReadTimeout } from "./utils";

export const DEFAULT_YOUTUBE_SETTINGS: YoutubeSettingsConfig = {
  channelId: "",
  channelUrl: "",
  liveStreamUrl: null,
  uploadsPlaylistId: null,
  featuredVideoId: null,
  autoFetchLatestSermons: false,
  showLiveBanner: false,
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown): string | null {
  const cleaned = cleanString(value);
  return cleaned.length > 0 ? cleaned : null;
}

function normalizeYoutubeSettings(data: Record<string, unknown> | null | undefined): YoutubeSettings {
  return {
    ...DEFAULT_YOUTUBE_SETTINGS,
    channelId: cleanString(data?.channelId),
    channelUrl: cleanString(data?.channelUrl),
    liveStreamUrl: cleanNullableString(data?.liveStreamUrl ?? data?.customLiveUrl),
    uploadsPlaylistId: cleanNullableString(data?.uploadsPlaylistId),
    featuredVideoId: cleanNullableString(data?.featuredVideoId),
    autoFetchLatestSermons: data?.autoFetchLatestSermons === true,
    showLiveBanner: data?.showLiveBanner === true,
    updatedAt: (data?.updatedAt as YoutubeSettings["updatedAt"]) ?? null,
    updatedBy: cleanNullableString(data?.updatedBy),
  };
}

async function getLegacyYoutubeSettings(): Promise<Record<string, unknown>> {
  const db = getAdminFirestore();
  const snapshot = await withReadTimeout(db.collection(collections.youtubeSettings).get());
  const settings: Record<string, unknown> = {};
  
  snapshot.docs.forEach((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const key = typeof data.key === "string" && data.key.trim() ? data.key.trim() : doc.id;
    settings[key] = data.value ?? data;
  });

  return settings;
}

export async function getYoutubeSettings(): Promise<YoutubeSettings> {
  try {
    const db = getAdminFirestore();
    const doc = await withReadTimeout(
      db
        .collection(collections.youtubeSettings)
        .doc(SINGLETON_DOCS.youtubeSettings)
        .get(),
    );

    if (doc.exists) {
      return normalizeYoutubeSettings(doc.data());
    }

    return normalizeYoutubeSettings(await getLegacyYoutubeSettings());
  } catch (error) {
    logDataFallback("getYoutubeSettings", error);
    return normalizeYoutubeSettings(null);
  }
}

export async function saveYoutubeSettings(
  settings: YoutubeSettingsConfig,
  updatedBy: string | null,
): Promise<void> {
  const db = getAdminFirestore();
  await db
    .collection(collections.youtubeSettings)
    .doc(SINGLETON_DOCS.youtubeSettings)
    .set(
      {
        ...settings,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy,
      },
      { merge: true },
    );
}
