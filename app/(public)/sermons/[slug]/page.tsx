import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PageHero } from "@/components/public/PageHero";
import { getSermonBySlug } from "@/lib/data/sermons";
import { Calendar, User } from "lucide-react";

interface SermonPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SermonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sermon = await getSermonBySlug(slug);

  if (!sermon) {
    return {
      title: "Sermon Not Found | Stonehill Church",
    };
  }

  return {
    title: sermon.seoTitle || `${sermon.title} | Stonehill Church`,
    description: sermon.seoDescription || sermon.description,
  };
}

export default async function SermonDetailPage({ params }: SermonPageProps) {
  const { slug } = await params;
  const sermon = await getSermonBySlug(slug);

  if (!sermon) {
    notFound();
  }

  const formattedDate = sermon.sermonDate
    ? new Date(sermon.sermonDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title={sermon.title}
        subtitle={sermon.series ? `Part of the ${sermon.series} series` : undefined}
      />

      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10 max-w-4xl mx-auto">
          
          {/* Video Player */}
          {sermon.youtubeVideoId ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black mb-8 shadow-inner">
              <iframe
                src={`https://www.youtube.com/embed/${sermon.youtubeVideoId}`}
                title={sermon.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : sermon.thumbnailUrl ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden mb-8 relative shadow-sm">
              <Image
                src={sermon.thumbnailUrl}
                alt={sermon.thumbnailAlt || sermon.title}
                fill
                className="object-cover"
              />
            </div>
          ) : null}

          {/* Details */}
          <div className="flex flex-wrap gap-6 text-stone-600 mb-8 border-b border-stone-100 pb-8">
            {sermon.speaker && (
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <span className="font-medium text-lg">{sermon.speaker}</span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-medium text-lg">{formattedDate}</span>
              </div>
            )}
          </div>

          <div className="prose prose-stone max-w-none prose-lg">
            {sermon.scripture && (
              <blockquote className="border-l-4 border-primary pl-4 italic text-stone-700 bg-stone-50 p-4 rounded-r-lg mb-8">
                <p className="m-0 font-serif text-xl">{sermon.scripture}</p>
              </blockquote>
            )}
            
            <h2 className="text-2xl font-bold font-serif mb-4 text-stone-900">About this Message</h2>
            <div className="whitespace-pre-wrap text-stone-700 leading-relaxed">
              {sermon.description}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
