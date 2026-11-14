import { AnnouncementBannerCarousel, type BannerItem } from "./AnnouncementBannerCarousel";

export async function TopAnnouncementBar() {
  const [{ getAnnouncementBarItems }, { getYoutubeSettings }] = await Promise.all([
    import("@/lib/data/announcements"),
    import("@/lib/data/youtubeSettings"),
  ]);
  const [activeAnnouncements, youtubeSettings] = await Promise.all([
    getAnnouncementBarItems(),
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

  // Already ordered by priority, then most recent start date.
  for (const announcement of activeAnnouncements) {
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
