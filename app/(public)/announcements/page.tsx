import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { AnnouncementCard } from "@/components/public/AnnouncementCard";
import { getPublicAnnouncements } from "@/lib/data/announcements";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "announcements",
    title: "Announcements",
    description: "News, updates, and announcements from Stonehill Seventh-day Adventist Church.",
    path: "/announcements",
  });
}

export default async function AnnouncementsIndexPage() {
  const announcements = await getPublicAnnouncements();

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <PageHero title="Announcements" subtitle="News and updates from our church family." />

      <section className="overflow-hidden py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {announcements.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {announcements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-stonehill-primary/10 text-stonehill-primary">
                <Megaphone className="h-8 w-8" aria-hidden="true" />
              </div>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">No Current Announcements</h2>
              <p className="mb-8 text-lg leading-relaxed text-slate-900/80">
                There are no announcements right now. See what&apos;s coming up on our events page or read the
                latest church bulletin.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/events" className={cn(buttonVariants({ variant: "outline" }))}>
                  Upcoming Events
                </Link>
                <Link href="/church-bulletin" className={cn(buttonVariants({ variant: "outline" }))}>
                  Church Bulletin
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
