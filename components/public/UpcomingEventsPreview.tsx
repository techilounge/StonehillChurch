import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import { EventCard } from "./EventCard";
import type { Serialized } from "@/lib/data/homepage";
import type { ChurchEvent } from "@/types/content";

interface UpcomingEventsPreviewProps {
  events: Serialized<ChurchEvent>[];
}

export function UpcomingEventsPreview({ events }: UpcomingEventsPreviewProps) {
  if (!events || events.length === 0) {
    return (
      <section className="py-16 bg-slate-50 sm:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-stonehill-primary sm:text-4xl mb-4">
            Upcoming Events
          </h2>
          <p className="text-lg text-slate-900/80 mb-8">
            No upcoming events listed at this time. Please check back later or view our full calendar.
          </p>
          <Link href="/events" className={cn(buttonVariants({ variant: "outline" }))}>
            View Full Calendar
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-slate-50 sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-stonehill-primary sm:text-4xl mb-4">
              Upcoming Events
            </h2>
            <p className="text-lg text-slate-900/80">
              Stay connected with our church family. Check out what&apos;s happening this month 
              and RSVP to let us know you&apos;re coming.
            </p>
          </div>
          <Link 
            href="/events" 
            className={cn(buttonVariants({ variant: "outline" }), "hidden md:inline-flex whitespace-nowrap")}
          >
            View Full Calendar
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {events.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
        
        <div className="mt-10 md:hidden flex justify-center">
          <Link href="/events" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
            View Full Calendar
          </Link>
        </div>
      </div>
    </section>
  );
}
