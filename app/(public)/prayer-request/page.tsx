import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { PrayerRequestForm } from "@/components/forms/public/PrayerRequestForm";
import { createPublicPageMetadata } from "@/lib/seoMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "prayer-request",
    title: "Prayer Request",
    description: "Submit a prayer request to the Stonehill SDA Church prayer team. We would love to pray for you.",
    path: "/prayer-request",
    noIndexFollow: true,
  });
}

export default function PrayerRequestPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <PageHero
        title="Prayer Requests"
        subtitle="How can we pray for you today? Our prayer team and pastoral staff are here to support you."
      />

      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-6 text-stonehill-primary">Submit a Request</h2>
            <blockquote className="border-l-4 border-stonehill-accent pl-6 italic text-slate-900/80 bg-white p-6 rounded-r-2xl mb-10 shadow-sm text-lg leading-relaxed text-left">
              <p className="m-0">
                &quot;Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.&quot; <br />
                <span className="font-semibold text-sm uppercase tracking-wider text-stonehill-primary mt-2 block">- Philippians 4:6</span>
              </p>
            </blockquote>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <PrayerRequestForm />
          </div>
        </div>
      </section>
    </main>
  );
}
