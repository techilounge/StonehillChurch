import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { VolunteerForm } from "@/components/forms/public/VolunteerForm";
import { createPublicPageMetadata } from "@/lib/seoMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "volunteer",
    title: "Volunteer",
    description: "Get involved and serve at Stonehill SDA Church. Discover ways to volunteer your time and talents.",
    path: "/volunteer",
    noIndexFollow: true,
  });
}

export default function VolunteerPage() {
  return (
    <main className="flex min-h-screen flex-col bg-stonehill-cream">
      <PageHero
        title="Volunteer with Us"
        subtitle="God has given each of us unique gifts to serve others. Find your place to serve at Stonehill."
      />

      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-stonehill-evergreen">Serve the Community</h2>
            <p className="text-lg text-stonehill-ink/80 leading-relaxed max-w-2xl mx-auto">
              Whether you want to greet guests, lead a children&apos;s class, or help with tech, there is a place for you to make a difference. Let us know how you'd like to get involved!
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-stonehill-line">
            <VolunteerForm />
          </div>
        </div>
      </section>
    </main>
  );
}
