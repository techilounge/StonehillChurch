import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { MinistryCard } from "@/components/public/MinistryCard";
import { getMinistries } from "@/lib/data/ministries";

export const metadata: Metadata = {
  title: "Ministries | Stonehill Church",
  description: "Discover the ministries at Stonehill Church and find your place to serve and grow.",
};

export default async function MinistriesIndexPage() {
  const ministries = await getMinistries();

  return (
    <main className="flex min-h-screen flex-col bg-stone-50">
      <PageHero
        title="Our Ministries"
        subtitle="Find your place to serve, connect, and grow in faith."
      />
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {ministries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {ministries.map((ministry) => (
                <MinistryCard key={ministry.id} ministry={ministry} />
              ))}
            </div>
          ) : (
             <div className="text-center py-12">
               <p className="text-lg text-stone-600">No ministries are currently listed. Please check back later.</p>
             </div>
          )}
        </div>
      </section>
    </main>
  );
}
