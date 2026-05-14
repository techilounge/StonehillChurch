import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { YouTubeLiteEmbed } from "@/components/public/YouTubeLiteEmbed";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { getSermonBySlug } from "@/lib/data/sermons";
import {
  breadcrumbJsonLd,
  createMetadata,
  createSermonMetadata,
  siteSettingsToSeoSettings,
  videoObjectJsonLd,
} from "@/lib/seo";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";

interface SermonPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SermonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [sermon, siteSettings] = await Promise.all([
    getSermonBySlug(slug),
    getSiteSettings(),
  ]);
  const seoSettings = siteSettingsToSeoSettings(siteSettings);

  if (!sermon) {
    return createMetadata({
      title: "Sermon Not Found",
      description: "This sermon could not be found.",
      path: `/sermons/${slug}`,
      settings: seoSettings,
      noIndex: true,
    });
  }

  return createSermonMetadata(sermon, seoSettings);
}

export default async function SermonDetailPage({ params }: SermonPageProps) {
  const { slug } = await params;
  const [sermon, siteSettings] = await Promise.all([
    getSermonBySlug(slug),
    getSiteSettings(),
  ]);

  if (!sermon) {
    notFound();
  }

  const seoSettings = siteSettingsToSeoSettings(siteSettings);
  const formattedDate = sermon.sermonDate
    ? new Date(sermon.sermonDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <JsonLd
        data={[
          videoObjectJsonLd(sermon, seoSettings.siteUrl),
          breadcrumbJsonLd(
            [
              { name: "Home", path: "/" },
              { name: "Sermons", path: "/sermons" },
              { name: sermon.title, path: `/sermons/${sermon.slug}` },
            ],
            seoSettings.siteUrl,
          ),
        ]}
      />
      <PageHero
        title={sermon.title}
        subtitle={sermon.series ? `Part of the ${sermon.series} series` : undefined}
      />

      <section className="py-16 md:py-24 overflow-hidden -mt-16 md:-mt-24 relative z-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          
          {/* Back Link */}
          <div className="mb-6">
            <Link 
              href="/sermons" 
              className="inline-flex items-center gap-2 text-slate-900/60 hover:text-stonehill-accent font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sermons
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10 border border-slate-200">
            
            {/* Video Player */}
            {sermon.youtubeVideoId ? (
              <div className="rounded-2xl overflow-hidden shadow-sm mb-8 ring-1 ring-slate-200 bg-slate-900">
                <YouTubeLiteEmbed
                  videoId={sermon.youtubeVideoId}
                  title={sermon.title}
                  thumbnailUrl={sermon.thumbnailUrl}
                  className="w-full aspect-video"
                />
              </div>
            ) : sermon.thumbnailUrl ? (
              <div className="aspect-video w-full rounded-2xl overflow-hidden mb-8 relative shadow-sm ring-1 ring-slate-200 bg-slate-50">
                <Image
                  src={sermon.thumbnailUrl}
                  alt={sermon.thumbnailAlt || sermon.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : null}

            {/* Details */}
            <div className="flex flex-wrap gap-6 text-slate-900/80 mb-8 border-b border-slate-200 pb-8">
              {sermon.speaker && (
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-stonehill-primary" />
                  <span className="font-medium text-lg">{sermon.speaker}</span>
                </div>
              )}
              {formattedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-stonehill-primary" />
                  <span className="font-medium text-lg">{formattedDate}</span>
                </div>
              )}
            </div>

            <div className="prose prose-lg max-w-none prose-headings:text-stonehill-primary prose-p:text-slate-900/80 leading-relaxed">
              {sermon.scripture && (
                <blockquote className="border-l-4 border-stonehill-accent pl-6 italic text-slate-900 bg-slate-50 p-6 rounded-r-2xl mb-10 shadow-sm">
                  <p className="m-0 text-xl leading-relaxed">{sermon.scripture}</p>
                </blockquote>
              )}
              
              <h2 className="text-2xl font-bold tracking-tight mb-4 text-slate-900">About this Message</h2>
              <div className="whitespace-pre-wrap">
                {sermon.description}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-white border-t border-slate-200 overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-stonehill-primary">Did this message bless you?</h2>
          <p className="text-slate-900/80 text-lg max-w-2xl mx-auto">
            We would love for you to join us in person this Sabbath, or feel free to share this message with a friend.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/plan-your-visit"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              Plan a Visit
            </Link>
            <Link 
              href="/give"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto border-transparent hover:bg-slate-200/50")}
            >
              Support Our Ministry
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
