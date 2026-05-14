import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { Heart, CreditCard, Landmark, Smartphone, ExternalLink } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "give",
    title: "Give",
    description: "Support the ministry and mission of Stonehill SDA Church through your tithes and offerings.",
    path: "/give",
  });
}

export default async function GivePage() {
  const settings = await getSiteSettings();
  const givingUrl = settings["giving.url"] || "https://adventistgiving.org";

  return (
    <main className="flex min-h-screen flex-col bg-slate-50 pb-24">
      <PageHero
        title="Give"
        subtitle="Partner with us to make a difference in our community and around the world."
      />

      <section className="py-16 md:py-24 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Heart className="w-16 h-16 text-stonehill-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-6">Generosity Changes Lives</h2>
            <p className="text-lg text-slate-900/80 max-w-2xl mx-auto leading-relaxed">
              Your giving supports the ongoing ministries, community outreach, and global missions of Stonehill SDA Church. 
              We believe that we are blessed to be a blessing. Thank you for your generosity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Online Giving */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="bg-stonehill-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-stonehill-primary ring-1 ring-slate-200">
                <CreditCard className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-4">Give Online</h3>
              <p className="text-slate-900/80 mb-8 flex-grow">
                Make a secure one-time or recurring donation using your credit card, debit card, or bank account.
              </p>
              <a
                href={givingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stonehill-accent px-6 py-3.5 font-semibold text-slate-900 shadow-sm transition-colors hover:bg-stonehill-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
              >
                AdventistGiving
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>

            {/* In Person */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="bg-stonehill-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-stonehill-primary ring-1 ring-slate-200">
                <Landmark className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-4">Give in Person</h3>
              <p className="text-slate-900/80 mb-8 flex-grow">
                You can give during our weekly worship services. Offering envelopes are available in the pews.
              </p>
            </div>

            {/* Mobile / Text */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="bg-stonehill-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-stonehill-primary ring-1 ring-slate-200">
                <Smartphone className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 mb-4">Give by App</h3>
              <p className="text-slate-900/80 mb-8 flex-grow">
                Download the AdventistGiving app on iOS or Android to give conveniently from your mobile device.
              </p>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
