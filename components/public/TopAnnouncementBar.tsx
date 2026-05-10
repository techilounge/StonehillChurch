import { AnnouncementBanner } from "./AnnouncementBanner";

export async function TopAnnouncementBar() {
  const [{ getActiveAnnouncements }, { getYoutubeSettings }] = await Promise.all([
    import("@/lib/data/homepage"),
    import("@/lib/data/youtubeSettings"),
  ]);
  const [activeAnnouncements, youtubeSettings] = await Promise.all([
    getActiveAnnouncements(),
    getYoutubeSettings(),
  ]);

  if (youtubeSettings.showLiveBanner) {
    return (
      <AnnouncementBanner
        title="Live now"
        message="Join the Stonehill worship service online."
        priority="urgent"
        ctaLabel="Watch live"
        ctaHref="/live"
        dismissible={false}
      />
    );
  }

  if (activeAnnouncements.length === 0) {
    return null;
  }

  // Find the highest priority announcement
  const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
  const sortedAnnouncements = activeAnnouncements.sort((a, b) => {
    return (
      priorityOrder[b.priority as keyof typeof priorityOrder] -
      priorityOrder[a.priority as keyof typeof priorityOrder]
    );
  });

  const topAnnouncement = sortedAnnouncements[0];

  return (
    <AnnouncementBanner
      title={topAnnouncement.title}
      message={topAnnouncement.body}
      priority={topAnnouncement.priority}
      ctaLabel={topAnnouncement.ctaLabel}
      ctaHref={topAnnouncement.ctaHref}
    />
  );
}
