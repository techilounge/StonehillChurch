import { AnnouncementBannerCarousel, type BannerItem } from "./AnnouncementBannerCarousel";

const PRIORITY_ORDER: Record<"urgent" | "high" | "normal" | "low", number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export async function TopAnnouncementBar() {
  const [{ getActiveAnnouncements }, { getYoutubeSettings }] = await Promise.all([
    import("@/lib/data/homepage"),
    import("@/lib/data/youtubeSettings"),
  ]);
  const [activeAnnouncements, youtubeSettings] = await Promise.all([
    getActiveAnnouncements(),
    getYoutubeSettings(),
  ]);

  const items: BannerItem[] = [];

  // The YouTube live banner is sticky and always sits first when active.
  if (youtubeSettings.showLiveBanner) {
    items.push({
      id: "youtube-live",
      title: "Live now",
      message: "Join the Stonehill worship service online.",
      priority: "urgent",
      ctaLabel: "Watch live",
      ctaHref: "/live",
      dismissible: false,
    });
  }

  const sortedAnnouncements = [...activeAnnouncements].sort(
    (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority],
  );

  for (const announcement of sortedAnnouncements) {
    items.push({
      id: announcement.id,
      title: announcement.title,
      message: announcement.body,
      priority: announcement.priority,
      ctaLabel: announcement.ctaLabel,
      ctaHref: announcement.ctaHref,
      openInNewTab: announcement.openInNewTab === true,
      imageUrl: announcement.imageUrl ?? null,
      imageAlt: announcement.imageAlt ?? null,
      dismissible: true,
    });
  }

  if (items.length === 0) return null;

  return <AnnouncementBannerCarousel items={items} />;
}
