import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { VolunteerForm } from "@/components/forms/public/VolunteerForm";
import { createPublicPageMetadata } from "@/lib/seoMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "volunteer",
    title: "Volunteer",
    description: "Get involved and serve at Stonehill Church. Discover ways to volunteer your time and talents.",
    path: "/volunteer",
    noIndexFollow: true,
  });
}

export default function VolunteerPage() {
  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Volunteer with Us"
        subtitle="God has given each of us unique gifts to serve others. Find your place to serve at Stonehill."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold font-serif mb-4 text-stone-900">Serve the Community</h2>
            <p className="text-lg text-stone-600">
              Whether you want to greet guests, lead a children's class, or help with tech, there is a place for you to make a difference.
            </p>
          </div>
          
          <VolunteerForm />
        </div>
      </section>
    </main>
  );
}
