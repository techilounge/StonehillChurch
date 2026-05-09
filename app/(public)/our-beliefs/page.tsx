import React from "react";
import { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { getPageBySlug } from "@/lib/data/pages";

export const metadata: Metadata = {
  title: "Our Beliefs | Stonehill Church",
  description: "Learn about the core beliefs and doctrines of Stonehill Church.",
};

export default async function OurBeliefsPage() {
  const pageContent = await getPageBySlug("our-beliefs");

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title={pageContent?.title || "Our Beliefs"}
        subtitle="What we believe about God, humanity, and salvation."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {pageContent ? (
            <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 border border-stone-100">
              <div 
                className="prose prose-stone max-w-none prose-lg prose-headings:font-serif prose-h2:text-3xl prose-h2:text-stone-900 prose-p:text-stone-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: pageContent.content }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 border border-stone-100 text-center">
              <h2 className="text-3xl font-bold font-serif mb-6 text-stone-900">Core Beliefs</h2>
              <p className="text-lg text-stone-700 leading-relaxed mb-6">
                We believe the Bible is the inspired Word of God, and it is our only rule of faith and practice.
              </p>
              <p className="text-lg text-stone-700 leading-relaxed">
                (This page content can be updated via the CMS by editing the 'our-beliefs' page).
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
