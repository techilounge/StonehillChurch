import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { MembershipTransferForm } from "@/components/forms/public/MembershipTransferForm";
import { createPublicPageMetadata } from "@/lib/seoMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "membership-transfer",
    title: "Membership Transfer",
    description: "Request a membership transfer to or from Stonehill Church.",
    path: "/membership-transfer",
    noIndexFollow: true,
  });
}

export default function MembershipTransferPage() {
  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Membership Transfer"
        subtitle="Ready to make Stonehill your church home, or moving to a new area?"
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold font-serif mb-4 text-stone-900">Transfer Request</h2>
            <p className="text-lg text-stone-600">
              Please provide the necessary details so our church clerk can process your transfer efficiently. 
            </p>
          </div>
          
          <MembershipTransferForm />
        </div>
      </section>
    </main>
  );
}
