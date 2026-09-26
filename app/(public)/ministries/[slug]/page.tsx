import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMinistryBySlug } from "@/lib/data/ministries";
import { getSiteSettings, getSpacingTokens, getCachedMediaSettings } from "@/lib/data/siteSettings";
import { PageBuilderRenderer } from "@/components/shared/page-builder/PageBuilderRenderer";
import {
  breadcrumbJsonLd,
  createMetadata,
  createMinistryMetadata,
  siteSettingsToSeoSettings,
} from "@/lib/seo";
import { Clock, User, Mail, Users, ArrowLeft } from "lucide-react";

interface MinistryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MinistryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [ministry, siteSettings] = await Promise.all([
    getMinistryBySlug(slug),
    getSiteSettings(),
  ]);
  const seoSettings = siteSettingsToSeoSettings(siteSettings);

  if (!ministry) {
    return createMetadata({
      title: "Ministry Not Found",
      description: "This ministry could not be found.",
      path: `/ministries/${slug}`,
      settings: seoSettings,
      noIndex: true,
    });
  }

  return createMinistryMetadata(ministry, seoSettings);
}

export default async function MinistryDetailPage({ params }: MinistryPageProps) {
  const { slug } = await params;
  const [ministry, siteSettings, spacingTokens, mediaSettings] = await Promise.all([
    getMinistryBySlug(slug),
    getSiteSettings(),
    getSpacingTokens(),
    getCachedMediaSettings(),
  ]);

  if (!ministry) {
    notFound();
  }

  const seoSettings = siteSettingsToSeoSettings(siteSettings);

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: "Ministries", path: "/ministries" },
            { name: ministry.name, path: `/ministries/${ministry.slug}` },
          ],
          seoSettings.siteUrl,
        )}
      />
      <PageHero
        title={ministry.name}
        subtitle={ministry.shortDescription}
        hasOverlap
      />

      <section className="py-16 md:py-24 overflow-hidden -mt-16 md:-mt-24 relative z-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          {/* Back Link */}
          <div className="mb-6">
            <Link 
              href="/ministries" 
              className="inline-flex items-center gap-2 text-slate-900/60 hover:text-stonehill-accent font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Ministries
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 flex flex-col md:flex-row">
            
            {/* Main Content */}
            <div className="p-8 md:p-10 flex-grow overflow-hidden">
              {ministry.builderData?.sections?.length ? (
                <PageBuilderRenderer document={ministry.builderData} spacingTokens={spacingTokens} mediaSettings={mediaSettings} />
              ) : (
                <>
                  {ministry.imageUrl && (
                    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8 ring-1 ring-slate-200 bg-slate-50">
                      <Image
                        src={ministry.imageUrl}
                        alt={ministry.imageAlt || ministry.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  <h2 className="text-2xl font-bold tracking-tight mb-6 text-stonehill-primary border-b border-slate-200 pb-4">About this Ministry</h2>
                  <div className="prose prose-lg max-w-none prose-headings:text-stonehill-primary prose-p:text-slate-900/80 prose-a:text-stonehill-accent hover:prose-a:text-stonehill-accent/80 leading-relaxed">
                    <div className="whitespace-pre-wrap">
                      {ministry.longDescription}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div className="bg-slate-50 p-8 md:p-10 md:w-1/3 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col gap-8">
              
              {ministry.meetingTime && (
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm text-stonehill-primary ring-1 ring-slate-200">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Meeting Time</p>
                    <p className="text-slate-900 font-medium leading-tight mt-1">{ministry.meetingTime}</p>
                  </div>
                </div>
              )}

              {ministry.leaderName && (
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm text-stonehill-primary ring-1 ring-slate-200">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Ministry Leader</p>
                    <p className="text-slate-900 font-medium leading-tight mt-1">{ministry.leaderName}</p>
                  </div>
                </div>
              )}

              {ministry.leaderEmail && (
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm text-stonehill-primary ring-1 ring-slate-200">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Contact Email</p>
                    <a href={`mailto:${ministry.leaderEmail}`} className="text-stonehill-primary hover:text-stonehill-dark hover:underline font-medium break-all mt-1 block">
                      {ministry.leaderEmail}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                 <div className="bg-white p-3 rounded-full shadow-sm text-stonehill-primary ring-1 ring-slate-200">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Category</p>
                    <p className="text-slate-900 font-medium capitalize mt-1">{ministry.category}</p>
                  </div>
              </div>

              {ministry.ctaHref && (
                <div className="mt-4 pt-6 border-t border-slate-200">
                  <Link
                    href={ministry.ctaHref}
                    target={ministry.openInNewTab ? "_blank" : undefined}
                    rel={ministry.openInNewTab ? "noopener noreferrer" : undefined}
                    className="w-full flex items-center justify-center gap-2 bg-stonehill-accent hover:bg-stonehill-accent/90 text-slate-900 py-3.5 px-6 rounded-xl transition-all font-semibold shadow-sm hover:-translate-y-0.5 text-center"
                  >
                    {ministry.ctaLabel || "Get Involved"}
                  </Link>
                </div>
              )}

            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
