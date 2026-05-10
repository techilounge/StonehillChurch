import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { PageHero } from "@/components/public/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { getMinistryBySlug } from "@/lib/data/ministries";
import { getSiteSettings } from "@/lib/data/siteSettings";
import {
  breadcrumbJsonLd,
  createMetadata,
  createMinistryMetadata,
  siteSettingsToSeoSettings,
} from "@/lib/seo";
import { Clock, User, Mail, Users } from "lucide-react";

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
  const [ministry, siteSettings] = await Promise.all([
    getMinistryBySlug(slug),
    getSiteSettings(),
  ]);

  if (!ministry) {
    notFound();
  }

  const seoSettings = siteSettingsToSeoSettings(siteSettings);

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
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
      />

      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden max-w-4xl mx-auto flex flex-col md:flex-row">
          
          {/* Main Content */}
          <div className="p-8 md:p-10 flex-grow">
            {ministry.imageUrl && (
              <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8">
                <Image
                  src={ministry.imageUrl}
                  alt={ministry.imageAlt || ministry.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            
            <h2 className="text-2xl font-bold font-serif mb-6 text-stone-900 border-b border-stone-100 pb-4">About this Ministry</h2>
            <div className="prose prose-stone max-w-none prose-lg">
              <div className="whitespace-pre-wrap text-stone-700 leading-relaxed">
                {ministry.longDescription}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-stone-50 p-8 md:p-10 md:w-1/3 border-t md:border-t-0 md:border-l border-stone-100 flex flex-col gap-6">
            
            {ministry.meetingTime && (
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Meeting Time</p>
                  <p className="text-stone-900 font-medium">{ministry.meetingTime}</p>
                </div>
              </div>
            )}

            {ministry.leaderName && (
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Ministry Leader</p>
                  <p className="text-stone-900 font-medium">{ministry.leaderName}</p>
                </div>
              </div>
            )}

            {ministry.leaderEmail && (
              <div className="flex items-start gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Contact Email</p>
                  <a href={`mailto:${ministry.leaderEmail}`} className="text-primary hover:underline font-medium break-all">
                    {ministry.leaderEmail}
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-start gap-4">
               <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide">Category</p>
                  <p className="text-stone-900 font-medium capitalize">{ministry.category}</p>
                </div>
            </div>

            {ministry.ctaHref && (
              <div className="mt-4 pt-6 border-t border-stone-200">
                <a
                  href={ministry.ctaHref}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-3 px-6 rounded-xl transition-all font-medium shadow-md hover:shadow-lg text-center"
                >
                  {ministry.ctaLabel || "Get Involved"}
                </a>
              </div>
            )}

          </div>

        </div>
      </div>
    </main>
  );
}
