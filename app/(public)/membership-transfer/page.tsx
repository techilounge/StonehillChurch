import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { MembershipTransferForm } from "@/components/forms/public/MembershipTransferForm";
import { createPublicPageMetadata } from "@/lib/seoMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "membership-transfer",
    title: "Membership Transfer",
    description: "Request a membership transfer to or from Stonehill SDA Church.",
    path: "/membership-transfer",
    noIndexFollow: true,
  });
}

export default function MembershipTransferPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <PageHero
        title="Membership Transfer"
        subtitle="Ready to make Stonehill your church home, or moving to a new area?"
      />

      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-stonehill-primary">Transfer Request</h2>
            <p className="text-lg text-slate-900/80 leading-relaxed max-w-2xl mx-auto">
              Please provide the necessary details so our church clerk can process your transfer efficiently. 
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <MembershipTransferForm />
          </div>
        </div>
      </section>
    </main>
  );
}
