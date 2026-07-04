import React from "react";
import type { Metadata } from "next";
import { 
  getHomepageSlides
} from "@/lib/data/homepage";
import { getUpcomingEvents } from "@/lib/data/events";
import { getFeaturedMinistries } from "@/lib/data/ministries";
import { getCachedSiteSettings, getCachedHomepageSlidesConfig } from "@/lib/data/siteSettings";
import { getLatestSermon } from "@/lib/data/sermons";
import { getLeaders } from "@/lib/data/leaders";

import { HeroCarousel } from "@/components/public/HeroCarousel";
import { QuickActions } from "@/components/public/QuickActions";
import { WelcomeSection } from "@/components/public/WelcomeSection";
import { ThisSabbath } from "@/components/public/ThisSabbath";
import { LatestSermonSection } from "@/components/public/LatestSermonSection";
import { MinistriesPreview } from "@/components/public/MinistriesPreview";
import { UpcomingEventsPreview } from "@/components/public/UpcomingEventsPreview";
import { ConnectSection } from "@/components/public/ConnectSection";
import { LocationMapSection } from "@/components/public/LocationMapSection";
import { createPublicPageMetadata } from "@/lib/seoMetadata";

export const revalidate = 60; // Revalidate at most every 60 seconds

export async function generateMetadata(): Promise<Metadata> {
  return createPublicPageMetadata({
    title: { absolute: "Stonehill Seventh-day Adventist Church" },
    description: "A welcoming Seventh-day Adventist church community.",
    path: "/",
  });
}

export default async function HomePage() {
  // Fetch data in parallel
  const [
    slides,
    latestSermon,
    upcomingEvents,
    featuredMinistries,
    siteSettings,
    leaders,
    homepageSlidesConfig
  ] = await Promise.all([
    getHomepageSlides(),
    getLatestSermon(),
    getUpcomingEvents(3),
    getFeaturedMinistries(4),
    getCachedSiteSettings(),
    getLeaders(),
    getCachedHomepageSlidesConfig(),
  ]);

  return (
    <>
      <HeroCarousel slides={slides} isLive={!!latestSermon?.isLive} heightConfig={homepageSlidesConfig} />
      <QuickActions isLive={!!latestSermon?.isLive} />
      <WelcomeSection settings={siteSettings} leaders={leaders} />
      <ThisSabbath settings={siteSettings} />
      <LatestSermonSection sermon={latestSermon} />
      <MinistriesPreview ministries={featuredMinistries} />
      <UpcomingEventsPreview events={upcomingEvents} />
      <ConnectSection />
      <LocationMapSection settings={siteSettings} />
    </>
  );
}
