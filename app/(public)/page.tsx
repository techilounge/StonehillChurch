import React from "react";
import { 
  getHomepageSlides
} from "@/lib/data/homepage";
import { getUpcomingEvents } from "@/lib/data/events";
import { getFeaturedMinistries } from "@/lib/data/ministries";
import { getSiteSettings } from "@/lib/data/siteSettings";
import { getLatestSermon } from "@/lib/data/sermons";

import { HeroCarousel } from "@/components/public/HeroCarousel";
import { QuickActions } from "@/components/public/QuickActions";
import { WelcomeSection } from "@/components/public/WelcomeSection";
import { ThisSabbath } from "@/components/public/ThisSabbath";
import { LatestSermonSection } from "@/components/public/LatestSermonSection";
import { MinistriesPreview } from "@/components/public/MinistriesPreview";
import { UpcomingEventsPreview } from "@/components/public/UpcomingEventsPreview";
import { ConnectSection } from "@/components/public/ConnectSection";
import { LocationMapSection } from "@/components/public/LocationMapSection";

export const revalidate = 60; // Revalidate at most every 60 seconds

export default async function HomePage() {
  // Fetch data in parallel
  const [
    slides,
    latestSermon,
    upcomingEvents,
    featuredMinistries,
    siteSettings
  ] = await Promise.all([
    getHomepageSlides(),
    getLatestSermon(),
    getUpcomingEvents(3),
    getFeaturedMinistries(4),
    getSiteSettings()
  ]);

  return (
    <>
      <HeroCarousel slides={slides} />
      <QuickActions />
      <WelcomeSection />
      <ThisSabbath settings={siteSettings} />
      <LatestSermonSection sermon={latestSermon} />
      <MinistriesPreview ministries={featuredMinistries} />
      <UpcomingEventsPreview events={upcomingEvents} />
      <ConnectSection />
      <LocationMapSection settings={siteSettings} />
    </>
  );
}
