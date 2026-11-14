import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import type { PublicAnnouncement } from "@/lib/data/announcements";
import { AnnouncementCard } from "./AnnouncementCard";

interface AnnouncementsPreviewProps {
  announcements: PublicAnnouncement[];
}

/**
 * Homepage feature for announcements an editor marked "Feature on Homepage".
 * Renders nothing when none are featured so the homepage layout is unchanged.
 */
export function AnnouncementsPreview({ announcements }: AnnouncementsPreviewProps) {
  if (announcements.length === 0) return null;

  return (
    <section className="overflow-hidden bg-white py-16 sm:py-24" aria-labelledby="homepage-announcements-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <h2
              id="homepage-announcements-heading"
              className="mb-4 text-3xl font-bold tracking-tight text-stonehill-primary sm:text-4xl"
            >
              Announcements
            </h2>
            <p className="text-lg text-slate-900/80">
              News and updates from our church family.
            </p>
          </div>
          <Link
            href="/announcements"
            className={cn(buttonVariants({ variant: "outline" }), "hidden whitespace-nowrap md:inline-flex")}
          >
            All Announcements
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {announcements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))}
        </div>

        <div className="mt-10 flex justify-center md:hidden">
          <Link href="/announcements" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
            All Announcements
          </Link>
        </div>
      </div>
    </section>
  );
}
