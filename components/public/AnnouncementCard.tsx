import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { ANNOUNCEMENT_CATEGORY_LABELS } from "@/lib/announcements";
import type { PublicAnnouncement } from "@/lib/data/announcements";
import { cn } from "@/lib/utils";

/**
 * Date-only CMS fields are stored as midnight in the editor's local time, which
 * for a US church is still the same calendar day in UTC. Formatting in UTC keeps
 * the rendered day stable regardless of the server's timezone.
 */
export function formatAnnouncementDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const PRIORITY_BADGE: Record<string, { label: string; className: string } | undefined> = {
  urgent: { label: "Urgent", className: "bg-red-50 text-red-700 ring-red-200" },
  high: { label: "Important", className: "bg-amber-50 text-amber-800 ring-amber-200" },
};

export function AnnouncementPriorityBadge({ priority }: { priority: string }) {
  const badge = PRIORITY_BADGE[priority];
  if (!badge) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        badge.className,
      )}
    >
      {badge.label}
    </span>
  );
}

interface AnnouncementCardProps {
  announcement: PublicAnnouncement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const postedOn = formatAnnouncementDate(announcement.startDate);

  return (
    <Link
      href={`/announcements/${announcement.slug}`}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
    >
      <Card className="flex h-full flex-col transition-shadow duration-300 hover:shadow-md">
        <div className="relative h-40 w-full overflow-hidden bg-stonehill-primary/5">
          {announcement.imageUrl ? (
            <Image
              src={announcement.imageUrl}
              alt={announcement.imageAlt || ""}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stonehill-primary/40">
              <Megaphone className="h-12 w-12" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="flex flex-grow flex-col gap-3 p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>{ANNOUNCEMENT_CATEGORY_LABELS[announcement.category]}</span>
            {postedOn && (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={announcement.startDate ?? undefined}>{postedOn}</time>
              </>
            )}
            <AnnouncementPriorityBadge priority={announcement.priority} />
          </div>
          <h3 className="text-xl font-bold leading-snug text-stonehill-primary group-hover:text-stonehill-accent">
            {announcement.title}
          </h3>
          {announcement.summary && (
            <p className="line-clamp-3 text-slate-900/80">{announcement.summary}</p>
          )}
          <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-stonehill-primary group-hover:text-stonehill-accent">
            Read more
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
