import React from "react";
import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { Heart, CreditCard, Landmark, Smartphone } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "give",
    title: "Give",
    description: "Support the ministry and mission of Stonehill Church through your tithes and offerings.",
    path: "/give",
  });
}

export default function GivePage() {
  return (
    <main className="flex min-h-screen flex-col bg-stone-50 pb-24">
      <PageHero
        title="Give"
        subtitle="Partner with us to make a difference in our community and around the world."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <Heart className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-stone-900 mb-6">Generosity Changes Lives</h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Your giving supports the ongoing ministries, community outreach, and global missions of Stonehill Church. 
              We believe that we are blessed to be a blessing. Thank you for your generosity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Online Giving */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-primary">
                <CreditCard className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold font-serif text-stone-900 mb-4">Give Online</h3>
              <p className="text-stone-600 mb-8 flex-grow">
                Make a secure one-time or recurring donation using your credit card, debit card, or bank account.
              </p>
              {/* Replace with actual giving link in production (e.g., AdventistGiving) */}
              <span className="w-full rounded-xl bg-stonehill-muted px-6 py-3 font-medium text-white">
                Giving Link Coming Soon
              </span>
            </div>

            {/* In Person */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-primary">
                <Landmark className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold font-serif text-stone-900 mb-4">Give in Person</h3>
              <p className="text-stone-600 mb-8 flex-grow">
                You can give during our weekly worship services. Offering envelopes are available in the pews.
              </p>
            </div>

            {/* Mobile / Text */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-primary">
                <Smartphone className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold font-serif text-stone-900 mb-4">Give by App</h3>
              <p className="text-stone-600 mb-8 flex-grow">
                Download the AdventistGiving app on iOS or Android to give conveniently from your mobile device.
              </p>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
