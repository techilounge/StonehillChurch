import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { getPageBySlug } from "@/lib/data/pages";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { BookOpen, Heart, Globe, Users } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "about",
    title: "About Us",
    description: "Learn about the history, mission, and vision of Stonehill SDA Church.",
    path: "/about",
  });
}

export default async function AboutPage() {
  const pageContent = await getPageBySlug("about");

  return (
    <main className="flex min-h-screen flex-col bg-stonehill-cream">
      <PageHero
        title={pageContent?.title || "About Stonehill SDA Church"}
        subtitle="A community built on faith, love, and service."
      />

      <section className="py-16 md:py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {pageContent ? (
            <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 border border-stonehill-line">
              <div 
                className="prose prose-lg max-w-none prose-headings:text-stonehill-evergreen prose-h2:text-3xl prose-p:text-stonehill-ink/80 prose-a:text-stonehill-gold hover:prose-a:text-stonehill-gold/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: pageContent.content }}
              />
            </div>
          ) : (
            <div className="space-y-16">
              {/* Pastoral Welcome */}
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold tracking-tight mb-6 text-stonehill-evergreen">A Warm Welcome</h2>
                <p className="text-lg text-stonehill-ink/80 leading-relaxed">
                  Whether you are a lifelong Adventist, exploring faith for the first time, or looking for a new church home, you are welcome at Stonehill. We believe that church is not just a building, but a family. We are thrilled you're taking the time to learn more about us, and we invite you to experience our community in person.
                </p>
              </div>

              {/* Mission & Story Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-stonehill-cream p-8 rounded-2xl border border-stonehill-line shadow-sm">
                  <div className="w-12 h-12 bg-stonehill-evergreen/10 text-stonehill-evergreen rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-4 text-stonehill-ink">Our Story</h3>
                  <p className="text-stonehill-ink/80 leading-relaxed">
                    Stonehill Church has a rich history of serving our local community. We were founded on the belief that God's grace transforms lives. For decades, we have been a place where individuals and families can grow spiritually and find meaningful connection.
                  </p>
                </div>

                <div className="bg-stonehill-evergreen p-8 rounded-2xl shadow-sm text-white">
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
              <div className="bg-white p-8 md:p-12 rounded-3xl border border-stonehill-line shadow-sm flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                  <div className="w-16 h-16 bg-stonehill-gold/20 text-stonehill-gold rounded-full flex items-center justify-center mb-6">
                    <Globe className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight mb-4 text-stonehill-evergreen">A Multicultural Family</h3>
                  <p className="text-lg text-stonehill-ink/80 leading-relaxed mb-6">
                    We celebrate the beautiful diversity of God's creation. Stonehill is home to individuals and families from many different cultural, ethnic, and socioeconomic backgrounds. We believe our diversity makes us stronger and gives us a glimpse of what heaven will be like.
                  </p>
                </div>
                <div className="flex-1 relative aspect-square md:aspect-auto md:h-64 w-full bg-stonehill-cream rounded-2xl overflow-hidden flex items-center justify-center">
                  <Users className="w-24 h-24 text-stonehill-evergreen/20" />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTAs */}
      <section className="py-16 bg-stonehill-cream overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-stonehill-ink">Next Steps</h2>
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
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto border-transparent hover:bg-stonehill-line/50")}
            >
              Contact Us
            </Link>
            <Link 
              href="/membership-transfer"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "w-full sm:w-auto text-stonehill-ink/70 hover:text-stonehill-ink")}
            >
              Transfer Membership
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
