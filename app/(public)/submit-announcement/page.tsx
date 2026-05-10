import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { AnnouncementRequestForm } from "@/components/forms/public/AnnouncementRequestForm";
import { createPublicPageMetadata } from "@/lib/seoMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "submit-announcement",
    title: "Submit Announcement",
    description: "Submit an announcement request for the church bulletin or website.",
    path: "/submit-announcement",
    noIndexFollow: true,
  });
}

export default function SubmitAnnouncementPage() {
  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Submit an Announcement"
        subtitle="Have news or an upcoming event to share with the church family?"
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold font-serif mb-4 text-stone-900">Announcement Request</h2>
            <p className="text-lg text-stone-600">
              Please submit announcements by Wednesday evening to be included in that weekend's bulletin and slides. All submissions are subject to review and approval by the church staff.
            </p>
          </div>
          
          <AnnouncementRequestForm />
        </div>
      </section>
    </main>
  );
}
