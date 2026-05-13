import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { Clock, MapPin, Heart, Users, Coffee } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "im-new",
    title: "I'm New",
    description: "Welcome to Stonehill SDA Church! Find out what to expect, where we are located, and how to get connected.",
    path: "/im-new",
  });
}

export default async function ImNewPage() {
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
        title="Welcome Home"
        subtitle="We're so glad you're here. Discover what Stonehill SDA Church is all about."
      />

      <section className="py-16 md:py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 text-stonehill-evergreen">What to Expect</h2>
          <p className="text-lg text-stonehill-ink/80 leading-relaxed mb-12 max-w-4xl mx-auto">
            Visiting a new church can be intimidating, but we want you to feel right at home from the moment you arrive. 
            At Stonehill, you&apos;ll find a welcoming community, inspiring worship, and biblical teaching that applies to your everyday life.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
            <div className="bg-stonehill-cream p-6 rounded-2xl border border-stonehill-line shadow-sm">
              <div className="w-12 h-12 bg-stonehill-evergreen/10 text-stonehill-evergreen rounded-full flex items-center justify-center mb-4">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2 text-stonehill-ink">Come as You Are</h3>
              <p className="text-stonehill-ink/80">
                There is no dress code. Whether you prefer a suit or jeans and a t-shirt, you are welcome here.
              </p>
            </div>
            
            <div className="bg-stonehill-cream p-6 rounded-2xl border border-stonehill-line shadow-sm">
              <div className="w-12 h-12 bg-stonehill-evergreen/10 text-stonehill-evergreen rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2 text-stonehill-ink">For the Whole Family</h3>
              <p className="text-stonehill-ink/80">
                We have dedicated, safe, and engaging programs for children and youth during our main services.
              </p>
            </div>

            <div className="bg-stonehill-cream p-6 rounded-2xl border border-stonehill-line shadow-sm">
              <div className="w-12 h-12 bg-stonehill-evergreen/10 text-stonehill-evergreen rounded-full flex items-center justify-center mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2 text-stonehill-ink">Authentic Community</h3>
              <p className="text-stonehill-ink/80">
                Experience worship that lifts the spirit and messages that are rooted in scripture and relevant to life.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-stonehill-cream overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 border border-stonehill-line flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold tracking-tight mb-6 text-stonehill-evergreen">Join Us This Sabbath</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-stonehill-gold shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-stonehill-ink">Service Times</h4>
                    <div className="text-stonehill-ink/80 whitespace-pre-wrap">
                      {`Breakfast Service: ${breakfastServiceTime}\nSabbath School: ${sabbathSchoolTime}\n\nDivine Worship: ${worshipServiceTime}\nPrayer Meeting: ${prayerMeetingTime}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-stonehill-gold shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-stonehill-ink">Location</h4>
                    <p className="text-stonehill-ink/80">
                      {address}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full text-center md:text-left">
              <h3 className="text-2xl font-bold tracking-tight mb-4 text-stonehill-ink">Ready to Visit?</h3>
              <p className="text-stonehill-ink/80 mb-6">
                Let us know you&apos;re coming so we can prepare to welcome you, answer any questions, and show you around.
              </p>
              <Link 
                href="/plan-your-visit"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Plan Your Visit
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
