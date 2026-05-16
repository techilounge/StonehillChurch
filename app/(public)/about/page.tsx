import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { getPageBySlug } from "@/lib/data/pages";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { BookOpen, Heart, Globe, Users, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, siteSettingsToSeoSettings } from "@/lib/seo";
import { formatPageContent } from "@/lib/contentFormatting";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "about",
    title: "About Us",
    description: "Learn about the history, mission, and vision of Stonehill SDA Church.",
    path: "/about",
  });
}

export default async function AboutPage() {
  const [pageContent, siteSettings] = await Promise.all([
    getPageBySlug("about"),
    getSiteSettings()
  ]);
  const seoSettings = siteSettingsToSeoSettings(siteSettings);

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ],
          seoSettings.siteUrl,
        )}
      />
      <PageHero
        title={pageContent?.title || "About Stonehill SDA Church"}
        subtitle="A community built on faith, love, and service."
      />

      <section className="py-16 md:py-24 bg-white overflow-hidden -mt-16 md:-mt-24 relative z-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          
          {/* Back Link */}
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-slate-900/60 hover:text-stonehill-accent font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
          {pageContent ? (
            <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 border border-slate-200">
              <div 
                className="prose prose-lg max-w-none prose-headings:text-stonehill-primary prose-h2:text-3xl prose-p:text-slate-900/80 prose-a:text-stonehill-accent hover:prose-a:text-stonehill-accent/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatPageContent(pageContent.content) }}
              />
            </div>
          ) : (
            <div className="space-y-16">
              {/* Pastoral Welcome */}
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight mb-6 text-stonehill-primary">A Warm Welcome</h2>
                <p className="text-lg text-slate-900/80 leading-relaxed">
                  Whether you are a lifelong Adventist, exploring faith for the first time, or looking for a new church home, you are welcome at Stonehill. We believe that church is not just a building, but a family. We are thrilled you're taking the time to learn more about us, and we invite you to experience our community in person.
                </p>
              </div>

              {/* Mission & Story Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-stonehill-primary/10 text-stonehill-primary rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-4 text-slate-900">Our Story</h3>
                  <p className="text-slate-900/80 leading-relaxed">
                    Stonehill Church has a rich history of serving our local community. We were founded on the belief that God's grace transforms lives. For decades, we have been a place where individuals and families can grow spiritually and find meaningful connection.
                  </p>
                </div>

                <div className="bg-stonehill-primary p-8 rounded-2xl shadow-sm text-white">
                  <div className="w-12 h-12 bg-white/20 text-white rounded-full flex items-center justify-center mb-6">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-4 text-white">Our Mission</h3>
                  <p className="text-white/90 leading-relaxed">
                    Our mission is to lead people into a growing, authentic relationship with Jesus Christ. We strive to be the hands and feet of Jesus, serving our neighbors, loving unconditionally, and sharing the hope of the gospel with everyone we meet.
                  </p>
                </div>
              </div>

              {/* Multicultural Identity */}
              <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                  <div className="w-16 h-16 bg-stonehill-accent/20 text-stonehill-accent rounded-full flex items-center justify-center mb-6">
                    <Globe className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight mb-4 text-stonehill-primary">A Multicultural Family</h3>
                  <p className="text-lg text-slate-900/80 leading-relaxed mb-6">
                    We celebrate the beautiful diversity of God's creation. Stonehill is home to individuals and families from many different cultural, ethnic, and socioeconomic backgrounds. We believe our diversity makes us stronger and gives us a glimpse of what heaven will be like.
                  </p>
                </div>
                <div className="flex-1 relative aspect-square md:aspect-auto md:h-64 w-full bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center">
                  <Users className="w-24 h-24 text-stonehill-primary/20" />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTAs */}
      <section className="py-16 bg-slate-50 overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Next Steps</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/plan-your-visit"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              Plan Your Visit
            </Link>
            <Link 
              href="/ministries"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
            >
              Explore Ministries
            </Link>
            <Link 
              href="/contact"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto border-transparent hover:bg-slate-200/50")}
            >
              Contact Us
            </Link>
            <Link 
              href="/membership-transfer"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "w-full sm:w-auto text-slate-900/70 hover:text-slate-900")}
            >
              Transfer Membership
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
