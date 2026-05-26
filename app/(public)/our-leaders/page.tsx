import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/public/PageHero";
import { LeaderCard } from "@/components/public/LeaderCard";
import { getLeaders } from "@/lib/data/leaders";
import { getLeaderCategories } from "@/lib/data/leaderCategories";
import { createPublicPageMetadata } from "@/lib/seoMetadata";
import { Users } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    cmsSlug: "our-leaders",
    title: "Our Leaders",
    description: "Meet the pastoral team and leaders at Stonehill SDA Church.",
    path: "/our-leaders",
  });
}

export default async function OurLeadersPage() {
  const [leaders, categories] = await Promise.all([getLeaders(), getLeaderCategories()]);

  // Group leaders by category id. getLeaders() already returns them in
  // per-category sort order, so the group order is preserved on push.
  const leadersByCategory = new Map<string, typeof leaders>();
  for (const leader of leaders) {
    const key = typeof leader.category === "string" && leader.category ? leader.category : "";
    const bucket = leadersByCategory.get(key);
    if (bucket) {
      bucket.push(leader);
    } else {
      leadersByCategory.set(key, [leader]);
    }
  }

  // Render categories in their admin-defined sortOrder. Any leaders whose
  // category is missing or no longer exists fall into a trailing "Uncategorized"
  // group.
  const orderedGroups: { id: string; name: string; leaders: typeof leaders }[] = [];
  for (const category of categories) {
    const bucket = leadersByCategory.get(category.id);
    if (bucket && bucket.length > 0) {
      orderedGroups.push({ id: category.id, name: category.name, leaders: bucket });
    }
  }
  const knownCategoryIds = new Set(categories.map((c) => c.id));
  const uncategorized: typeof leaders = [];
  for (const [key, bucket] of leadersByCategory.entries()) {
    if (key === "" || !knownCategoryIds.has(key)) {
      uncategorized.push(...bucket);
    }
  }
  if (uncategorized.length > 0) {
    orderedGroups.push({ id: "__uncategorized__", name: "Uncategorized", leaders: uncategorized });
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <PageHero
        title="Our Leaders"
        subtitle="Meet the pastoral team and staff serving Stonehill SDA Church."
      />

      <section className="py-16 md:py-24 bg-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {leaders.length > 0 ? (
            <div className="space-y-16">
              {orderedGroups.map((group) => (
                <div key={group.id}>
                  <h2 className="font-display text-3xl font-bold tracking-tight text-stonehill-primary mb-8">
                    {group.name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {group.leaders.map((leader) => (
                      <LeaderCard key={leader.id} leader={leader} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-3xl mx-auto">
              <div className="w-16 h-16 bg-stonehill-primary/10 text-stonehill-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-4 text-slate-900">Our Team</h2>
              <p className="text-lg text-slate-900/80 leading-relaxed mb-8">
                Our leadership team information is currently being updated. Please check back later to learn more about the dedicated individuals who serve our church community.
              </p>
              <Link href="/contact" className={cn(buttonVariants({ variant: "outline" }))}>
                Contact Us
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTAs */}
      <section className="py-16 bg-slate-50 overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Get Involved</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/ministries"
              className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
            >
              Explore Ministries
            </Link>
            <Link 
              href="/plan-your-visit"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
            >
              Plan Your Visit
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
