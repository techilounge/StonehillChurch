import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PageHero } from "@/components/public/PageHero";
import { getEventBySlug } from "@/lib/data/events";
import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return {
      title: "Event Not Found | Stonehill Church",
    };
  }

  return {
    title: event.seoTitle || `${event.title} | Stonehill Church`,
    description: event.seoDescription || event.description,
  };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const startDate = event.startDateTime ? new Date(event.startDateTime) : null;
  const endDate = event.endDateTime ? new Date(event.endDateTime) : null;

  const formattedDate = startDate
    ? startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "";

  const formattedTime = startDate
    ? startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + 
      (endDate ? ` - ${endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : "")
    : "";

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title={event.title}
        imageUrl={event.imageUrl}
        imageAlt={event.imageAlt}
      />

      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden max-w-4xl mx-auto flex flex-col md:flex-row">
          
          {/* Main Content */}
          <div className="p-8 md:p-10 flex-grow">
            <h2 className="text-2xl font-bold font-serif mb-6 text-stone-900 border-b border-stone-100 pb-4">Event Details</h2>
            <div className="prose prose-stone max-w-none prose-lg">
              <div className="whitespace-pre-wrap text-stone-700 leading-relaxed">
                {event.description}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-stone-50 p-8 md:p-10 md:w-1/3 border-t md:border-t-0 md:border-l border-stone-100 flex flex-col gap-6">
            
            {formattedDate && (
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Date</p>
                  <p className="text-stone-900 font-medium">{formattedDate}</p>
                </div>
              </div>
            )}

            {formattedTime && (
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Time</p>
                  <p className="text-stone-900 font-medium">{formattedTime}</p>
                </div>
              </div>
            )}

            {event.location && (
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Location</p>
                  <p className="text-stone-900 font-medium">{event.location}</p>
                </div>
              </div>
            )}

            {event.registrationUrl && (
              <div className="mt-4 pt-6 border-t border-stone-200">
                <a
                  href={event.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-xl transition-all font-medium shadow-md hover:shadow-lg"
                >
                  Register Now
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}
