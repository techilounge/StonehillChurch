import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { SermonCard } from "@/components/public/SermonCard";
import { getSermons } from "@/lib/data/sermons";
import { getYoutubeSettings } from "@/lib/data/youtubeSettings";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { getYouTubeChannelUrl } from "@/lib/youtube";
import { PlayCircle } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "sermons",
    title: "Sermons",
    description: "Watch or listen to recent sermons and teachings from Stonehill SDA Church.",
    path: "/sermons",
  });
}

export default async function SermonsIndexPage() {
  const [sermons, youtubeSettings] = await Promise.all([
    getSermons(),
    getYoutubeSettings(),
  ]);
  const channelUrl = getYouTubeChannelUrl(youtubeSettings);

  return (
    <main className="flex min-h-screen flex-col bg-stonehill-cream">
      <PageHero
        title="Sermons"
        subtitle="Watch or listen to recent teachings."
      />
      
      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {sermons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {sermons.map((sermon) => (
                <SermonCard key={sermon.id} sermon={sermon} />
              ))}
            </div>
          ) : (
             <div className="bg-white rounded-3xl p-12 text-center border border-stonehill-line shadow-sm max-w-3xl mx-auto">
               <div className="w-16 h-16 bg-stonehill-evergreen/10 text-stonehill-evergreen rounded-full flex items-center justify-center mx-auto mb-6">
                 <PlayCircle className="w-8 h-8" />
               </div>
               <h2 className="text-2xl font-bold tracking-tight mb-4 text-stonehill-ink">No Sermons Available</h2>
               <p className="text-lg text-stonehill-ink/80 leading-relaxed mb-8">
                 Sermons are currently being updated. Please check back later or visit our YouTube channel for live streams.
               </p>
               <a
                 href={channelUrl}
                 target="_blank"
                 rel="noopener noreferrer"
                 className={cn(buttonVariants({ variant: "outline" }))}
               >
                 Visit YouTube Channel
               </a>
             </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white border-t border-stonehill-line overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-stonehill-evergreen">Want to listen live?</h2>
          <p className="text-stonehill-ink/80 text-lg max-w-2xl mx-auto">
            Join us every Sabbath morning for uplifting worship and biblical teaching. We stream our Divine Worship service online and welcome you to attend in person.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/live"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto bg-stonehill-gold text-stonehill-ink hover:bg-stonehill-gold/90")}
            >
              Watch Live
            </Link>
            <Link
              href="/plan-your-visit"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
            >
              Plan a Visit
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
