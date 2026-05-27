import "server-only";

import { collections } from "@/lib/constants/collections";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { withReadTimeout } from "./utils";

export type MediaUsage = {
  area: string;
  collection: string;
  docId: string;
  label: string;
};

export type MediaUsageMap = Record<string, MediaUsage[]>;

type ScanTarget = {
  collection: string;
  area: string;
  pickLabel: (doc: Record<string, any>) => string;
};

const SCAN_TARGETS: ScanTarget[] = [
  {
    collection: collections.siteSettings,
    area: "Site Settings",
    pickLabel: (doc) => `Settings group: ${doc.__id ?? "general"}`,
  },
  {
    collection: collections.homepageSlides,
    area: "Homepage Slides",
    pickLabel: (doc) => doc.title || "Untitled slide",
  },
  {
    collection: collections.sermons,
    area: "Sermons",
    pickLabel: (doc) => doc.title || "Untitled sermon",
  },
  {
    collection: collections.events,
    area: "Events",
    pickLabel: (doc) => doc.title || "Untitled event",
  },
  {
    collection: collections.ministries,
    area: "Ministries",
    pickLabel: (doc) => doc.name || "Untitled ministry",
  },
  {
    collection: collections.leaders,
    area: "Leaders",
    pickLabel: (doc) => doc.name || "Untitled leader",
  },
  {
    collection: collections.announcements,
    area: "Announcements",
    pickLabel: (doc) => doc.title || "Untitled announcement",
  },
  {
    collection: collections.resources,
    area: "Resources",
    pickLabel: (doc) => doc.title || "Untitled resource",
  },
  {
    collection: collections.popups,
    area: "Popups",
    pickLabel: (doc) => doc.title || "Untitled popup",
  },
  {
    collection: collections.pages,
    area: "Pages",
    pickLabel: (doc) => doc.title || doc.slug || "Untitled page",
  },
];

function docMatchesUrl(serialized: string, url: string): boolean {
  if (!url) return false;
  return serialized.includes(url);
}

export type MediaUsageInput = {
  id: string;
  url: string;
};

export async function findMediaUsages(
  assets: MediaUsageInput[],
): Promise<MediaUsageMap> {
  const usageMap: MediaUsageMap = {};
  const validAssets = assets.filter((a) => a.id && a.url);

  for (const asset of validAssets) {
    usageMap[asset.id] = [];
  }

  if (validAssets.length === 0) {
    return usageMap;
  }

  const firestore = getAdminFirestore();

  await Promise.all(
    SCAN_TARGETS.map(async (target) => {
      let snapshot;
      try {
        snapshot = await withReadTimeout(firestore.collection(target.collection).get());
      } catch (error) {
        console.error(
          `[mediaUsage] failed to read collection ${target.collection}:`,
          error,
        );
        return;
      }

      for (const doc of snapshot.docs) {
        const data = doc.data() as Record<string, any>;
        const withId = { ...data, __id: doc.id };
        let serialized = "";
        try {
          serialized = JSON.stringify(withId);
        } catch {
          continue;
        }
        if (!serialized) continue;

        for (const asset of validAssets) {
          if (docMatchesUrl(serialized, asset.url)) {
            usageMap[asset.id].push({
              area: target.area,
              collection: target.collection,
              docId: doc.id,
              label: target.pickLabel(withId),
            });
          }
        }
      }
    }),
  );

  return usageMap;
}

export async function findMediaUsagesByIds(ids: string[]): Promise<MediaUsageMap> {
  const unique = Array.from(new Set(ids.filter((id) => typeof id === "string" && id.length > 0)));
  if (unique.length === 0) return {};

  const firestore = getAdminFirestore();
  const assets: MediaUsageInput[] = [];

  await Promise.all(
    unique.map(async (id) => {
      try {
        const snap = await firestore.collection(collections.mediaAssets).doc(id).get();
        if (!snap.exists) return;
        const data = snap.data() as { url?: string } | undefined;
        if (data?.url && typeof data.url === "string") {
          assets.push({ id, url: data.url });
        }
      } catch (error) {
        console.error(`[mediaUsage] failed to read media asset ${id}:`, error);
      }
    }),
  );

  return findMediaUsages(assets);
}
