import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { TopAnnouncementBar } from "@/components/public/TopAnnouncementBar";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-stonehill-cream text-stonehill-ink">
      <TopAnnouncementBar />
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
