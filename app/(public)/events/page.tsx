import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { EventCard } from "@/components/public/EventCard";
import { getUpcomingEvents } from "@/lib/data/events";
import { createPublicPageMetadata } from "@/lib/seoMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "events",
    title: "Events",
    description: "Join us for upcoming events, gatherings, and special services at Stonehill Church.",
    path: "/events",
  });
}

export default async function EventsIndexPage() {
  const events = await getUpcomingEvents();

  return (
    <main className="flex min-h-screen flex-col bg-stone-50">
      <PageHero
        title="Upcoming Events"
        subtitle="Connect, grow, and serve with our church family."
      />
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
             <div className="text-center py-12">
               <p className="text-lg text-stone-600">No upcoming events are currently scheduled. Please check back later.</p>
             </div>
          )}
        </div>
      </section>
    </main>
  );
}
