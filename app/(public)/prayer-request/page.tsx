import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { PrayerRequestForm } from "@/components/forms/public/PrayerRequestForm";
import { createPublicPageMetadata } from "@/lib/seoMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "prayer-request",
    title: "Prayer Request",
    description: "Submit a prayer request to the Stonehill Church prayer team. We would love to pray for you.",
    path: "/prayer-request",
    noIndexFollow: true,
  });
}

export default function PrayerRequestPage() {
  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Prayer Requests"
        subtitle="How can we pray for you today? Our prayer team and pastoral staff are here to support you."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold font-serif mb-4 text-stone-900">Submit a Request</h2>
            <p className="text-lg text-stone-600">
              "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." – Philippians 4:6
            </p>
          </div>
          
          <PrayerRequestForm />
        </div>
      </section>
    </main>
  );
}
