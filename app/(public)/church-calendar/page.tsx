import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { Calendar } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "church-calendar",
    title: "Church Calendar",
    description: "View the official church calendar for Stonehill Church events and gatherings.",
    path: "/church-calendar",
  });
}

export default async function ChurchCalendarPage() {
  const settings = await getSiteSettings();

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Church Calendar"
        subtitle="Stay up to date with everything happening at Stonehill Church."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10 border border-stone-100">
            {/* If the church has a Google Calendar embed URL configured in the future, it would go here. 
                For now, we display a placeholder or a list of upcoming events. */}
            
            <div className="aspect-[4/3] md:aspect-[16/9] w-full bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center p-8 text-center">
              <Calendar className="w-16 h-16 text-stone-300 mb-4" />
              <h2 className="text-2xl font-bold font-serif text-stone-900 mb-2">Calendar Integration Coming Soon</h2>
              <p className="text-stone-600 max-w-md mx-auto">
                Our interactive church calendar is currently being updated. In the meantime, please check our <a href="/events" className="text-primary hover:underline">Events page</a> for upcoming activities.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
