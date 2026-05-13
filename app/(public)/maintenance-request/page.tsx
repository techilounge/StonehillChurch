import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { MaintenanceRequestForm } from "@/components/forms/public/MaintenanceRequestForm";
import { createPublicPageMetadata } from "@/lib/seoMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "maintenance-request",
    title: "Maintenance Request",
    description: "Report an issue or submit a maintenance request for the church building or grounds.",
    path: "/maintenance-request",
    noIndexFollow: true,
  });
}

export default function MaintenanceRequestPage() {
  return (
    <main className="flex min-h-screen flex-col bg-stonehill-cream">
      <PageHero
        title="Maintenance Request"
        subtitle="Help us keep our church home safe, clean, and functioning."
      />

      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-stonehill-evergreen">Report an Issue</h2>
            <p className="text-lg text-stonehill-ink/80 leading-relaxed max-w-2xl mx-auto">
              Notice something broken, leaking, or needing attention? Please submit a request to our facilities team so we can address it promptly.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-stonehill-line">
            <MaintenanceRequestForm />
          </div>
        </div>
      </section>
    </main>
  );
}
