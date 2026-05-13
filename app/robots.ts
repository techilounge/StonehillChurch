import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { absoluteUrl, siteSettingsToSeoSettings } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  const { siteUrl } = siteSettingsToSeoSettings(await getSiteSettings());

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/admin/*", "/api", "/api/", "/api/*"],
    },
    sitemap: absoluteUrl("/sitemap.xml", siteUrl),
    host: siteUrl,
  };
}
