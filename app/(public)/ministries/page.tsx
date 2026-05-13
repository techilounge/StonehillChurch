import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { MinistryCard } from "@/components/public/MinistryCard";
import { getMinistries } from "@/lib/data/ministries";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { HeartHandshake } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "ministries",
    title: "Ministries",
    description: "Discover the ministries at Stonehill SDA Church and find your place to serve and grow.",
    path: "/ministries",
  });
}

export default async function MinistriesIndexPage() {
  const ministries = await getMinistries();

  return (
    <main className="flex min-h-screen flex-col bg-stonehill-cream">
      <PageHero
        title="Our Ministries"
        subtitle="Find your place to serve, connect, and grow in faith."
      />
      
      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {ministries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {ministries.map((ministry) => (
                <MinistryCard key={ministry.id} ministry={ministry} />
              ))}
            </div>
          ) : (
             <div className="bg-white rounded-3xl p-12 text-center border border-stonehill-line shadow-sm max-w-3xl mx-auto">
               <div className="w-16 h-16 bg-stonehill-evergreen/10 text-stonehill-evergreen rounded-full flex items-center justify-center mx-auto mb-6">
                 <HeartHandshake className="w-8 h-8" />
               </div>
               <h2 className="text-2xl font-bold tracking-tight mb-4 text-stonehill-ink">No Ministries Listed</h2>
               <p className="text-lg text-stonehill-ink/80 leading-relaxed mb-8">
                 Ministry information is currently being updated. Please check back later to discover how you can get involved and serve our community.
               </p>
               <Link 
                 href="/contact" 
                 className={cn(buttonVariants({ variant: "outline" }))}
               >
                 Contact Us for Details
               </Link>
             </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white border-t border-stonehill-line overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-stonehill-evergreen">Ready to volunteer?</h2>
          <p className="text-stonehill-ink/80 text-lg max-w-2xl mx-auto">
            We believe everyone has unique gifts to share. If you're interested in serving in a specific area, we'd love to help you get connected.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/volunteer"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              Volunteer Now
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
