import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { getPageBySlug } from "@/lib/data/pages";
import { createPublicPageMetadata } from "@/lib/seoMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "about",
    title: "About Us",
    description: "Learn about the history, mission, and vision of Stonehill Church.",
    path: "/about",
  });
}

export default async function AboutPage() {
  const pageContent = await getPageBySlug("about");

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title={pageContent?.title || "About Stonehill Church"}
        subtitle="Our mission, vision, and history."
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
              <h2 className="text-3xl font-bold font-serif mb-6 text-stone-900">Our Story</h2>
              <p className="text-lg text-stone-700 leading-relaxed mb-6">
                Stonehill Church is a community of believers dedicated to loving God, loving people, and serving our world. 
                Our mission is to lead people into a growing relationship with Jesus Christ.
              </p>
              <p className="text-lg text-stone-700 leading-relaxed">
                (This page content can be updated via the CMS by editing the 'about' page).
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
