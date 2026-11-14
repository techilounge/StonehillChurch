import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ExternalLink, Info } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  AnnouncementPriorityBadge,
  formatAnnouncementDate,
} from "@/components/public/AnnouncementCard";
import { ANNOUNCEMENT_CATEGORY_LABELS } from "@/lib/announcements";
import { getAnnouncementBySlug } from "@/lib/data/announcements";
import { getCachedSiteSettings } from "@/lib/data/siteSettings";
import { isValidSafeUrl } from "@/lib/pageBuilderSafety";
import { breadcrumbJsonLd, createMetadata, siteSettingsToSeoSettings, toIsoString } from "@/lib/seo";

export const revalidate = 300;

interface AnnouncementPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AnnouncementPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [detail, siteSettings] = await Promise.all([
    getAnnouncementBySlug(slug),
    getCachedSiteSettings(),
  ]);
  const settings = siteSettingsToSeoSettings(siteSettings);

  if (!detail) {
    return createMetadata({
      title: "Announcement Not Found",
      description: "This announcement could not be found.",
      path: `/announcements/${slug}`,
      settings,
      noIndex: true,
    });
  }

  const { announcement, hasEnded } = detail;
  return createMetadata({
    title: announcement.seoTitle || announcement.title,
    description: announcement.seoDescription || announcement.summary,
    path: `/announcements/${announcement.slug}`,
    image: announcement.imageUrl,
    type: "article",
    publishedTime: toIsoString(announcement.publishedAt ?? announcement.startDate),
    modifiedTime: toIsoString(announcement.updatedAt),
    settings,
    // Ended announcements stay reachable for shared links but drop out of search.
    noIndexFollow: hasEnded,
  });
}

export default async function AnnouncementDetailPage({ params }: AnnouncementPageProps) {
  const { slug } = await params;
  const [detail, siteSettings] = await Promise.all([
    getAnnouncementBySlug(slug),
    getCachedSiteSettings(),
  ]);

  if (!detail) notFound();

  const { announcement, hasEnded } = detail;
  const { siteUrl } = siteSettingsToSeoSettings(siteSettings);
  const postedOn = formatAnnouncementDate(announcement.startDate);
  const ctaHref = announcement.ctaHref && isValidSafeUrl(announcement.ctaHref) ? announcement.ctaHref : null;
  const openInNewTab = announcement.openInNewTab === true;

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: "Announcements", path: "/announcements" },
            { name: announcement.title, path: `/announcements/${announcement.slug}` },
          ],
          siteUrl,
        )}
      />
      <PageHero
        title={announcement.title}
        imageUrl={announcement.imageUrl}
        imageAlt={announcement.imageAlt}
        hasOverlap
      />

      <section className="relative z-20 -mt-16 overflow-hidden py-16 md:-mt-24 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              href="/announcements"
              className="inline-flex items-center gap-2 font-medium text-slate-900/60 transition-colors hover:text-stonehill-accent"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              All Announcements
            </Link>
          </div>

          <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-10">
            <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-6 text-sm text-slate-500">
              <span className="font-semibold uppercase tracking-wide">
                {ANNOUNCEMENT_CATEGORY_LABELS[announcement.category]}
              </span>
              {postedOn && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  <time dateTime={announcement.startDate ?? undefined}>{postedOn}</time>
                </span>
              )}
              <AnnouncementPriorityBadge priority={announcement.priority} />
            </div>

            {hasEnded && (
              <p className="mb-6 flex items-start gap-2 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                This announcement is no longer current and is kept here for reference.
              </p>
            )}

            {/* Announcement bodies are plain text; render as text, never HTML. */}
            <div className="whitespace-pre-wrap text-lg leading-relaxed text-slate-900/80">
              {announcement.body}
            </div>

            {ctaHref && announcement.ctaLabel && !hasEnded && (
              <div className="mt-8 border-t border-slate-200 pt-6">
                <a
                  href={ctaHref}
                  target={openInNewTab ? "_blank" : undefined}
                  rel={openInNewTab ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-stonehill-accent px-6 py-3.5 font-semibold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-stonehill-accent/90"
                >
                  {announcement.ctaLabel}
                  {openInNewTab && <ExternalLink className="h-4 w-4" aria-hidden="true" />}
                </a>
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
