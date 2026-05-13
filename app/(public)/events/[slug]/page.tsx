import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { getEventBySlug } from "@/lib/data/events";
import { getSiteSettings } from "@/lib/data/siteSettings";
import {
  breadcrumbJsonLd,
  createEventMetadata,
  createMetadata,
  eventJsonLd,
  siteSettingsToSeoSettings,
} from "@/lib/seo";
import { Calendar, Clock, MapPin, ExternalLink, ArrowLeft } from "lucide-react";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [event, siteSettings] = await Promise.all([
    getEventBySlug(slug),
    getSiteSettings(),
  ]);
  const seoSettings = siteSettingsToSeoSettings(siteSettings);

  if (!event) {
    return createMetadata({
      title: "Event Not Found",
      description: "This event could not be found.",
      path: `/events/${slug}`,
      settings: seoSettings,
      noIndex: true,
    });
  }

  return createEventMetadata(event, seoSettings);
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { slug } = await params;
  const [event, siteSettings] = await Promise.all([
    getEventBySlug(slug),
    getSiteSettings(),
  ]);

  if (!event) {
    notFound();
  }

  const seoSettings = siteSettingsToSeoSettings(siteSettings);
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
    <main className="flex min-h-screen flex-col bg-stonehill-cream">
      <JsonLd
        data={[
          eventJsonLd(event, seoSettings.siteUrl),
          breadcrumbJsonLd(
            [
              { name: "Home", path: "/" },
              { name: "Events", path: "/events" },
              { name: event.title, path: `/events/${event.slug}` },
            ],
            seoSettings.siteUrl,
          ),
        ]}
      />
      <PageHero
        title={event.title}
        imageUrl={event.imageUrl}
        imageAlt={event.imageAlt}
      />

      <section className="py-16 md:py-24 overflow-hidden -mt-16 md:-mt-24 relative z-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          {/* Back Link */}
          <div className="mb-6">
            <Link 
              href="/events" 
              className="inline-flex items-center gap-2 text-stonehill-ink/60 hover:text-stonehill-gold font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Events
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-stonehill-line flex flex-col md:flex-row">
            
            {/* Main Content */}
            <div className="p-8 md:p-10 flex-grow">
              <h2 className="text-2xl font-bold tracking-tight mb-6 text-stonehill-evergreen border-b border-stonehill-line pb-4">Event Details</h2>
              <div className="prose prose-lg max-w-none prose-headings:text-stonehill-evergreen prose-p:text-stonehill-ink/80 prose-a:text-stonehill-gold hover:prose-a:text-stonehill-gold/80 leading-relaxed">
                <div className="whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="bg-stonehill-cream p-8 md:p-10 md:w-1/3 border-t md:border-t-0 md:border-l border-stonehill-line flex flex-col gap-8">
              
              {formattedDate && (
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm text-stonehill-evergreen ring-1 ring-stonehill-line">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stonehill-muted uppercase tracking-wide">Date</p>
                    <p className="text-stonehill-ink font-medium leading-tight mt-1">{formattedDate}</p>
                  </div>
                </div>
              )}

              {formattedTime && (
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm text-stonehill-evergreen ring-1 ring-stonehill-line">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stonehill-muted uppercase tracking-wide">Time</p>
                    <p className="text-stonehill-ink font-medium leading-tight mt-1">{formattedTime}</p>
                  </div>
                </div>
              )}

              {event.location && (
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm text-stonehill-evergreen ring-1 ring-stonehill-line">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stonehill-muted uppercase tracking-wide">Location</p>
                    <p className="text-stonehill-ink font-medium leading-tight mt-1">{event.location}</p>
                  </div>
                </div>
              )}

              {event.registrationUrl && (
                <div className="mt-4 pt-6 border-t border-stonehill-line">
                  <a
                    href={event.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-stonehill-gold hover:bg-stonehill-gold/90 text-stonehill-ink py-3.5 px-6 rounded-xl transition-all font-semibold shadow-sm hover:-translate-y-0.5"
                  >
                    Register Now
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
