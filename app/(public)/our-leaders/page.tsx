import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { LeaderCard } from "@/components/public/LeaderCard";
import { getLeaders } from "@/lib/data/leaders";

export const metadata: Metadata = {
  title: "Our Leaders | Stonehill Church",
  description: "Meet the pastoral team and leaders at Stonehill Church.",
};

export default async function OurLeadersPage() {
  const leaders = await getLeaders();

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Our Leaders"
        subtitle="Meet the pastoral team and staff serving Stonehill Church."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          {leaders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {leaders.map((leader) => (
                <LeaderCard key={leader.id} leader={leader} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-stone-600">Leader information is currently being updated. Please check back later.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
