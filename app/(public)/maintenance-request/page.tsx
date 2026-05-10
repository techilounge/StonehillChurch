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
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Maintenance Request"
        subtitle="Help us keep our church home safe, clean, and functioning."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold font-serif mb-4 text-stone-900">Report an Issue</h2>
            <p className="text-lg text-stone-600">
              Notice something broken, leaking, or needing attention? Please submit a request to our facilities team so we can address it promptly.
            </p>
          </div>
          
          <MaintenanceRequestForm />
        </div>
      </section>
    </main>
  );
}
