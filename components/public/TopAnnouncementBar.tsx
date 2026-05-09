import { getActiveAnnouncements } from "@/lib/data/homepage";
import { AnnouncementBanner } from "./AnnouncementBanner";

export async function TopAnnouncementBar() {
  const activeAnnouncements = await getActiveAnnouncements();

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
