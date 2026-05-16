import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { getPageBySlug } from "@/lib/data/pages";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { Book, Cross, RefreshCcw, HeartHandshake } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import { formatPageContent } from "@/lib/contentFormatting";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "our-beliefs",
    title: "Our Beliefs",
    description: "Learn about the core beliefs and doctrines of Stonehill SDA Church.",
    path: "/our-beliefs",
  });
}

export default async function OurBeliefsPage() {
  const pageContent = await getPageBySlug("our-beliefs");

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <PageHero
        title={pageContent?.title || "Our Beliefs"}
        subtitle="What we believe about God, humanity, and salvation."
      />

      <section className="py-16 md:py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {pageContent ? (
            <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 border border-slate-200">
              <div 
                className="prose prose-lg max-w-none prose-headings:text-stonehill-primary prose-h2:text-3xl prose-p:text-slate-900/80 prose-a:text-stonehill-accent hover:prose-a:text-stonehill-accent/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: formatPageContent(pageContent.content) }}
              />
            </div>
          ) : (
            <div className="space-y-16">
              
              {/* Introduction & SDA Summary */}
              <div className="text-center max-w-3xl mx-auto space-y-6">
                <h2 className="text-3xl font-bold tracking-tight text-stonehill-primary">A Foundation of Faith</h2>
                <p className="text-lg text-slate-900/80 leading-relaxed">
                  We believe that God loves us unconditionally and desires a relationship with every person. Our faith is rooted entirely in the Bible, which we see as God's inspired word and the ultimate guide for living a life of purpose, joy, and peace.
                </p>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left mt-8">
                  <h3 className="font-bold text-slate-900 mb-2">Seventh-day Adventist Faith</h3>
                  <p className="text-slate-900/80">
                    As a Seventh-day Adventist congregation, we share a global mission to proclaim the everlasting gospel. We celebrate the biblical Sabbath (Saturday) as a day of rest, worship, and fellowship, and we eagerly look forward to the literal, visible, and imminent return of Jesus Christ.
                  </p>
                </div>
              </div>

              {/* Grouped Beliefs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* God */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-stonehill-primary/10 text-stonehill-primary rounded-full flex items-center justify-center mb-6">
                    <Cross className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-4 text-slate-900">God & Salvation</h3>
                  <p className="text-slate-900/80 leading-relaxed">
                    There is one God: Father, Son, and Holy Spirit. God is love. Through Jesus' life, death on the cross, and resurrection, God provided the only means of salvation. We are saved by grace through faith, entirely as a free gift.
                  </p>
                </div>

                {/* The Bible */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-stonehill-primary/10 text-stonehill-primary rounded-full flex items-center justify-center mb-6">
                    <Book className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-4 text-slate-900">The Bible</h3>
                  <p className="text-slate-900/80 leading-relaxed">
                    The Holy Scriptures are the infallible revelation of God's will. They are the standard of character, the test of experience, the authoritative revealer of doctrines, and the trustworthy record of God's acts in history.
                  </p>
                </div>

                {/* The Sabbath */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-stonehill-primary/10 text-stonehill-primary rounded-full flex items-center justify-center mb-6">
                    <RefreshCcw className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-4 text-slate-900">The Sabbath</h3>
                  <p className="text-slate-900/80 leading-relaxed">
                    The seventh day of the week, Saturday, is the biblical Sabbath. God established it at creation as a day of rest and a memorial of His creative power. It is a time for worship, family, and joyful communion with God.
                  </p>
                </div>

                {/* The Church & Living */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-12 h-12 bg-stonehill-primary/10 text-stonehill-primary rounded-full flex items-center justify-center mb-6">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight mb-4 text-slate-900">Living with Purpose</h3>
                  <p className="text-slate-900/80 leading-relaxed">
                    Because God loves us, we are called to love others. We believe in living healthfully, serving our community compassionately, and treating all people with dignity and respect as beings created in the image of God.
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTAs */}
      <section className="py-16 bg-slate-50 overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Experience It With Us</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/plan-your-visit"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              Plan Your Visit
            </Link>
            <Link 
              href="/sermons"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
            >
              Watch Sermons
            </Link>
            <Link 
              href="/contact"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto border-transparent hover:bg-slate-200/50")}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
