import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { EventCard } from "@/components/public/EventCard";
import { getUpcomingEvents } from "@/lib/data/events";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { CalendarDays } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "events",
    title: "Events",
    description: "Join us for upcoming events, gatherings, and special services at Stonehill SDA Church.",
    path: "/events",
  });
}

export default async function EventsIndexPage() {
  const events = await getUpcomingEvents();

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <PageHero
        title="Upcoming Events"
        subtitle="Connect, grow, and serve with our church family."
      />
      
      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
             <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-3xl mx-auto">
               <div className="w-16 h-16 bg-stonehill-primary/10 text-stonehill-primary rounded-full flex items-center justify-center mx-auto mb-6">
                 <CalendarDays className="w-8 h-8" />
               </div>
               <h2 className="text-2xl font-bold tracking-tight mb-4 text-slate-900">No Upcoming Events</h2>
               <p className="text-lg text-slate-900/80 leading-relaxed mb-8">
                 We don't have any upcoming events scheduled at the moment. Please check back later or view our church calendar for recurring services.
               </p>
               <Link 
                 href="/church-calendar" 
                 className={cn(buttonVariants({ variant: "outline" }))}
               >
                 View Church Calendar
               </Link>
             </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white border-t border-slate-200 overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-stonehill-primary">Want to stay updated?</h2>
          <p className="text-slate-900/80 text-lg max-w-2xl mx-auto">
            Get the latest updates on upcoming events and church announcements by reading our weekly bulletin or following our social media channels.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/church-bulletin"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              View Latest Bulletin
            </Link>
            <Link 
              href="/contact"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
