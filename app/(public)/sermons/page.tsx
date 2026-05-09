import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { SermonCard } from "@/components/public/SermonCard";
import { getSermons } from "@/lib/data/sermons";

export const metadata: Metadata = {
  title: "Sermons | Stonehill Church",
  description: "Watch or listen to recent sermons and teachings from Stonehill Church.",
};

export default async function SermonsIndexPage() {
  const sermons = await getSermons();

  return (
    <main className="flex min-h-screen flex-col bg-stone-50">
      <PageHero
        title="Sermons"
        subtitle="Watch or listen to recent teachings."
      />
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          {sermons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sermons.map((sermon) => (
                <SermonCard key={sermon.id} sermon={sermon} />
              ))}
            </div>
          ) : (
             <div className="text-center py-12">
               <p className="text-lg text-stone-600">No sermons are currently available. Please check back later.</p>
             </div>
          )}
        </div>
      </section>
    </main>
  );
}
