import "server-only";

import type { Metadata } from "next";
import {
  createMetadata,
  createPageMetadata,
  siteSettingsToSeoSettings,
  type SiteSeoSettings,
} from "@/lib/seo";

type PublicPageMetadataConfig = {
  cmsSlug?: string;
  title: string | { absolute: string };
  description?: string | null;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string | null;
  settings?: Partial<SiteSeoSettings>;
  noIndex?: boolean;
  noIndexFollow?: boolean;
};

export async function createPublicPageMetadata({
  cmsSlug,
  settings: providedSettings,
  ...fallback
}: PublicPageMetadataConfig): Promise<Metadata> {
  const [page, siteSettings] = await Promise.all([
    cmsSlug
      ? import("@/lib/data/pages").then(({ getPageBySlug }) => getPageBySlug(cmsSlug))
      : Promise.resolve(null),
    providedSettings
      ? Promise.resolve(null)
      : import("@/lib/data/siteSettings").then(({ getCachedSiteSettings }) =>
          getCachedSiteSettings(),
        ),
  ]);
  const settings = providedSettings ?? siteSettingsToSeoSettings(siteSettings ?? {});

  if (cmsSlug) {
    return createPageMetadata(page, { ...fallback, settings });
  }

  return createMetadata({ ...fallback, settings });
}
