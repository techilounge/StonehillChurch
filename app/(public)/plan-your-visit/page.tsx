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
    description: "Plan your visit to Stonehill SDA Church. Find service times, directions, and let us know you're coming.",
    path: "/plan-your-visit",
  });
}

export default async function PlanYourVisitPage() {
  const settings = await getSiteSettings();
  const breakfastServiceTime = settings["service_times.breakfast_service"] || "Saturdays · 9:00am";
  const sabbathSchoolTime = settings["service_times.sabbath_school"] || "Saturdays · 10:00am";
  const worshipServiceTime =
    settings["service_times.divine_worship"] ||
    settings["service_times.worship_service"] ||
    "Saturdays · 11:00am";
  const prayerMeetingTime = settings["service_times.prayer_meeting"] || "Wednesdays · 7:00pm";
  const address = settings["contact.address"] || "1487 Stonehill Ridge Road, Spokane, WA 99203";

  return (
    <main className="flex min-h-screen flex-col bg-stonehill-cream">
      <PageHero
        title="Plan Your Visit"
        subtitle="We can't wait to meet you. Here is everything you need to know."
      />

      <section className="py-16 bg-white border-b border-stonehill-line overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* When and Where */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-8 text-stonehill-evergreen">When & Where</h2>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4 bg-stonehill-cream p-6 rounded-2xl border border-stonehill-line shadow-sm">
                  <Clock className="w-8 h-8 text-stonehill-gold shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-stonehill-ink mb-2">Service Times</h3>
                    <div className="text-stonehill-ink/80 whitespace-pre-wrap leading-relaxed text-lg">
                      {`Breakfast Service: ${breakfastServiceTime}\nSabbath School: ${sabbathSchoolTime}\n\nDivine Worship: ${worshipServiceTime}\nPrayer Meeting: ${prayerMeetingTime}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-stonehill-cream p-6 rounded-2xl border border-stonehill-line shadow-sm">
                  <MapPin className="w-8 h-8 text-stonehill-gold shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-stonehill-ink mb-2">Location</h3>
                    <div className="text-stonehill-ink/80 whitespace-pre-wrap leading-relaxed text-lg mb-4">
                      {address}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Let us know you're coming (Placeholder for Phase 13 Form) */}
            <div className="bg-stonehill-cream p-8 rounded-3xl border border-stonehill-line shadow-sm">
              <h2 className="text-2xl font-bold tracking-tight mb-4 text-stonehill-evergreen">Let Us Know You&apos;re Coming!</h2>
              <p className="text-stonehill-ink/80 mb-8">
                Fill out the form below (coming soon) so we can prepare a welcome gift for you and make sure someone is ready to show you around.
              </p>
              
              <div className="bg-white border-2 border-dashed border-stonehill-line rounded-xl p-8 flex items-center justify-center text-center shadow-inner">
                <p className="text-stonehill-muted font-medium italic">
                  [ Plan Your Visit Form will be available in a future update ]<br/>
                  In the meantime, just show up! We&apos;d love to have you.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Map Section */}
      <LocationMapSection settings={settings} />

    </main>
  );
}
