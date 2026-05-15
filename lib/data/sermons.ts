import "server-only";

import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import type { Sermon } from "@/types/content";
import { PUBLISHED } from "@/types/shared";
import { logDataFallback, serializeData, withReadTimeout, type Serialized } from "./utils";
import { getYoutubeSettings } from "./youtubeSettings";
import { getLatestYoutubeUploads, getYoutubeVideoById } from "./youtubeVideos";
import type { YouTubeVideo } from "@/lib/youtube";

function youtubeVideoToSermon(video: YouTubeVideo): Serialized<Sermon> {
  const dateStr = video.publishedAt || new Date().toISOString();
  return {
    id: video.id,
    title: video.title,
    slug: video.id, // We use the video ID as the slug
    speaker: null,
    sermonDate: dateStr,
    scripture: null,
    series: null,
    description: video.description,
    youtubeUrl: video.url,
    youtubeVideoId: video.id,
    thumbnailUrl: video.thumbnailUrl,
    thumbnailAlt: `${video.title} thumbnail`,
    featured: false,
    status: PUBLISHED,
    seoTitle: video.title,
    seoDescription: video.description.substring(0, 150),
    createdAt: dateStr,
    updatedAt: dateStr,
    createdBy: "youtube-sync",
    updatedBy: "youtube-sync",
  };
}

export async function getSermons(): Promise<Serialized<Sermon>[]> {
  try {
    const youtubeSettings = await getYoutubeSettings();
    if (youtubeSettings.autoFetchLatestSermons) {
      const videos = await getLatestYoutubeUploads(youtubeSettings, 12);
      return videos.map(youtubeVideoToSermon);
    }

    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.sermons)
        .where("status", "==", PUBLISHED)
        .orderBy("sermonDate", "desc")
        .get(),
    );

    return snapshot.docs.map((doc) =>
      serializeData({ id: doc.id, ...doc.data() } as unknown as Sermon),
    );
  } catch (error) {
    logDataFallback("getSermons", error);
    return [];
  }
}

export async function getSermonBySlug(slug: string): Promise<Serialized<Sermon> | null> {
  try {
    const youtubeSettings = await getYoutubeSettings();
    if (youtubeSettings.autoFetchLatestSermons) {
      const video = await getYoutubeVideoById(slug);
      if (video) {
        return youtubeVideoToSermon(video);
      }
      // If auto-fetch is enabled but it's not a YouTube video (or API fails),
      // we can optionally fall back to Firestore to support older legacy URLs
    }

    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.sermons)
        .where("status", "==", PUBLISHED)
        .where("slug", "==", slug)
        .limit(1)
        .get(),
    );

    if (snapshot.empty) return null;
    return serializeData(
      { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as Sermon,
    );
  } catch (error) {
    logDataFallback("getSermonBySlug", error);
    return null;
  }
}

export async function getLatestSermon(): Promise<Serialized<Sermon> | null> {
  try {
    const youtubeSettings = await getYoutubeSettings();
    if (youtubeSettings.autoFetchLatestSermons) {
      const videos = await getLatestYoutubeUploads(youtubeSettings, 1);
      if (videos.length > 0) {
        return youtubeVideoToSermon(videos[0]);
      }
    }

    const db = getAdminFirestore();
    const snapshot = await withReadTimeout(
      db
        .collection(collections.sermons)
        .where("status", "==", PUBLISHED)
        .orderBy("sermonDate", "desc")
        .limit(1)
        .get(),
    );

    if (snapshot.empty) return null;
    return serializeData(
      { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as unknown as Sermon,
    );
  } catch (error) {
    logDataFallback("getLatestSermon", error);
    return null;
  }
}
