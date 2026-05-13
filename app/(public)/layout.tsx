import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { TopAnnouncementBar } from "@/components/public/TopAnnouncementBar";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, placeJsonLd, siteSettingsToSeoSettings } from "@/lib/seo";

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
    <div className="min-h-screen bg-stonehill-cream text-stonehill-ink">
      <JsonLd data={[organizationJsonLd(seoSettings), placeJsonLd(seoSettings)]} />
      <TopAnnouncementBar />
      <PublicHeader />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <PublicFooter settings={siteSettings} />
    </div>
  );
}
