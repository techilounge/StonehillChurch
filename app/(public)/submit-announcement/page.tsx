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
    <main className="flex min-h-screen flex-col bg-slate-50">
      <PageHero
        title="Submit an Announcement"
        subtitle="Have news or an upcoming event to share with the church family?"
      />

      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-stonehill-primary">Announcement Request</h2>
            <div className="bg-white border-l-4 border-stonehill-accent p-6 rounded-r-2xl shadow-sm text-left">
              <p className="text-lg text-slate-900/80 leading-relaxed m-0">
                Please submit announcements by <span className="font-semibold text-slate-900">Wednesday evening</span> to be included in that weekend&apos;s bulletin and slides. All submissions are subject to review and approval by the church staff.
              </p>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <AnnouncementRequestForm />
          </div>
        </div>
      </section>
    </main>
  );
}
