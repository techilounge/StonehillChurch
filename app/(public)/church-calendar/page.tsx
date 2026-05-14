import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { EventCard } from "@/components/public/EventCard";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { getUpcomingEvents } from "@/lib/data/events";
import { Calendar } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "church-calendar",
    title: "Church Calendar",
    description: "View the official church calendar for Stonehill SDA Church events and gatherings.",
    path: "/church-calendar",
  });
}

export default async function ChurchCalendarPage() {
  const events = await getUpcomingEvents();

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 pb-24">
      <PageHero
        title="Church Calendar"
        subtitle="Stay up to date with everything happening at Stonehill SDA Church."
      />

      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {events.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 max-w-4xl mx-auto overflow-hidden">
              <div className="aspect-[4/3] md:aspect-[21/9] w-full bg-slate-50 flex flex-col items-center justify-center p-8 text-center border-b border-slate-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-200">
                  <Calendar className="w-10 h-10 text-stonehill-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-3">No Upcoming Events Listed</h2>
                <p className="text-slate-900/80 text-lg max-w-lg mx-auto">
                  Published church events will appear here as they are added to the calendar.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
