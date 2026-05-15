import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { TopAnnouncementBar } from "@/components/public/TopAnnouncementBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, placeJsonLd, siteSettingsToSeoSettings } from "@/lib/seo";

import { AppCheckInit } from "@/components/public/AppCheckInit";

export const revalidate = 300;

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { getCachedSiteSettings } = await import("@/lib/data/siteSettings");
  const siteSettings = await getCachedSiteSettings();
  const seoSettings = siteSettingsToSeoSettings(siteSettings);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopAnnouncementBar />
      <PublicHeader settings={siteSettings} />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <PublicFooter settings={siteSettings} />
      {/*
       * JSON-LD lives at the bottom of the layout as the last child of the
       * outer div. Placing it here (rather than as a Fragment sibling at the
       * top) avoids hydration mismatches with React 19 + Turbopack, which
       * sometimes shifts <script> elements out of their declared position
       * during SSR. Position-in-body has no SEO impact — crawlers parse
       * ld+json anywhere in the document.
       */}
      <JsonLd data={[organizationJsonLd(seoSettings), placeJsonLd(seoSettings)]} />
      <AppCheckInit />
    </div>
  );
}
