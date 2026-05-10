import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { Clock, MapPin } from "lucide-react";
import { LocationMapSection } from "@/components/public/LocationMapSection";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "plan-your-visit",
    title: "Plan Your Visit",
    description: "Plan your visit to Stonehill Church. Find service times, directions, and let us know you're coming.",
    path: "/plan-your-visit",
  });
}

export default async function PlanYourVisitPage() {
  const settings = await getSiteSettings();

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Plan Your Visit"
        subtitle="We can't wait to meet you. Here is everything you need to know."
      />

      <section className="py-16 bg-white border-b border-stone-100">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* When and Where */}
            <div>
              <h2 className="text-3xl font-bold font-serif mb-8 text-stone-900">When & Where</h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4 bg-stone-50 p-6 rounded-2xl">
                  <Clock className="w-8 h-8 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold font-serif text-stone-900 mb-2">Service Times</h3>
                    <div className="text-stone-600 whitespace-pre-wrap leading-relaxed text-lg">
                      {settings?.serviceTimes || "Sabbath School: 9:30 AM\nDivine Worship: 11:00 AM"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-stone-50 p-6 rounded-2xl">
                  <MapPin className="w-8 h-8 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold font-serif text-stone-900 mb-2">Location</h3>
                    <div className="text-stone-600 whitespace-pre-wrap leading-relaxed text-lg mb-4">
                      {settings?.address || "123 Stonehill Way\nCity, ST 12345"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Let us know you're coming (Placeholder for Phase 13 Form) */}
            <div className="bg-stone-50 p-8 rounded-3xl border border-stone-200">
              <h2 className="text-2xl font-bold font-serif mb-4 text-stone-900">Let Us Know You're Coming!</h2>
              <p className="text-stone-600 mb-8">
                Fill out the form below (coming soon) so we can prepare a welcome gift for you and make sure someone is ready to show you around.
              </p>
              
              <div className="bg-white border-2 border-dashed border-stone-300 rounded-xl p-8 flex items-center justify-center text-center">
                <p className="text-stone-500 font-medium italic">
                  [ Plan Your Visit Form will be available in a future update ]<br/>
                  In the meantime, just show up! We'd love to have you.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Map Section */}
      <LocationMapSection />

    </main>
  );
}
