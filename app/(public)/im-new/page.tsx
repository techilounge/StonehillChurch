import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { Clock, MapPin, Heart, Users, Coffee } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "im-new",
    title: "I'm New",
    description: "Welcome to Stonehill Church! Find out what to expect, where we are located, and how to get connected.",
    path: "/im-new",
  });
}

export default async function ImNewPage() {
  const settings = await getSiteSettings();

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Welcome Home"
        subtitle="We're so glad you're here. Discover what Stonehill Church is all about."
      />

      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-serif mb-6 text-stone-900">What to Expect</h2>
          <p className="text-lg text-stone-700 leading-relaxed mb-12">
            Visiting a new church can be intimidating, but we want you to feel right at home from the moment you arrive. 
            At Stonehill, you'll find a welcoming community, inspiring worship, and biblical teaching that applies to your everyday life.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-2 text-stone-900">Come as You Are</h3>
              <p className="text-stone-600">
                There is no dress code. Whether you prefer a suit or jeans and a t-shirt, you are welcome here.
              </p>
            </div>
            
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-2 text-stone-900">For the Whole Family</h3>
              <p className="text-stone-600">
                We have dedicated, safe, and engaging programs for children and youth during our main services.
              </p>
            </div>

            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-serif mb-2 text-stone-900">Authentic Community</h3>
              <p className="text-stone-600">
                Experience worship that lifts the spirit and messages that are rooted in scripture and relevant to life.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-stone-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 border border-stone-200 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl font-bold font-serif mb-6 text-stone-900">Join Us This Sabbath</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-stone-900">Service Times</h4>
                    <div className="text-stone-600 whitespace-pre-wrap">
                      {settings?.serviceTimes || "Sabbath School: 9:30 AM\nDivine Worship: 11:00 AM"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-stone-900">Location</h4>
                    <p className="text-stone-600">
                      {settings?.address || "123 Stonehill Way\nCity, ST 12345"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full text-center md:text-left">
              <h3 className="text-2xl font-bold font-serif mb-4 text-stone-900">Ready to Visit?</h3>
              <p className="text-stone-600 mb-6">
                Let us know you're coming so we can prepare to welcome you, answer any questions, and show you around.
              </p>
              <Link 
                href="/plan-your-visit"
                className="inline-block bg-primary hover:bg-primary-dark text-white font-medium py-3 px-8 rounded-full transition-colors shadow-sm"
              >
                Plan Your Visit
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
