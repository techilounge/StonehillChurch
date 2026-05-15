import React from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import type { Leader } from "@/types/content";
import type { SiteSettingsMap } from "@/lib/data/siteSettings";
import type { Serialized } from "@/lib/data/utils";

interface WelcomeSectionProps {
  settings?: SiteSettingsMap;
  leaders?: Serialized<Leader>[];
}

const WELCOME_DEFAULTS = {
  left_title: "Welcome to Stonehill Seventh-day Adventist Church",
  left_paragraph: "We're a vibrant community of believers in Pflugerville, TX. We invite you to join us as we worship the Lord, nurture one another, and selflessly serve our neighbors. Our Saturday worship services provide an uplifting experience focused on biblical teaching, inspirational music, and heartfelt prayer. We offer a variety of ministries and spiritual growth opportunities for children, youth, adults, and seniors.",
  right_paragraph_1: "Welcome Home to Stonehill. We are grateful you have taken a moment to visit us online. Whether you are a long-time member, a returning friend, or someone exploring faith for the first time, please know you are warmly welcomed here.",
  right_paragraph_2: "One of our greatest blessings is the beautiful diversity of our church family. Our members represent more than 50 countries now living in the United States, united by one faith, one hope, and one Savior. At Stonehill, we celebrate our multicultural community as a reflection of God's kingdom and His love for all people."
} as const;

export function WelcomeSection({ settings = {}, leaders = [] }: WelcomeSectionProps) {
  const topLeaders = leaders.slice(0, 2);

  const leftTitle = settings["welcome.left_title"] || WELCOME_DEFAULTS.left_title;
  const leftParagraph = settings["welcome.left_paragraph"] || WELCOME_DEFAULTS.left_paragraph;
  const rightParagraph1 = settings["welcome.right_paragraph_1"] || WELCOME_DEFAULTS.right_paragraph_1;
  const rightParagraph2 = settings["welcome.right_paragraph_2"] || WELCOME_DEFAULTS.right_paragraph_2;

  return (
    <section className="overflow-hidden bg-slate-50 py-16 sm:py-24 relative font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:gap-x-16 lg:items-start">
          {/* Left Column */}
          <div className="flex flex-col">
            <span className="font-handwritten text-stonehill-accent text-5xl md:text-6xl mb-4 -ml-2 select-none">
              Welcome
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-stonehill-dark leading-tight mb-6">
              {leftTitle}
            </h2>
            <div className="text-lg leading-relaxed text-slate-900/80 mb-8 whitespace-pre-wrap">
              {leftParagraph}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <Link href="/plan-your-visit" className={cn(buttonVariants({ size: "lg" }))}>
                Plan Your Visit
              </Link>
              <Link href="/about" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                Learn More About Us
              </Link>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col items-center lg:mt-16">
            {topLeaders.length > 0 && (
              <div className="flex flex-wrap justify-center gap-10 md:gap-16 mb-10">
                {topLeaders.map((leader) => (
                  <div key={leader.id} className="flex flex-col items-center text-center max-w-[200px]">
                    <div className="group relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-stonehill-accent overflow-hidden mb-4 shadow-xl transition-all duration-500 ease-out hover:shadow-2xl hover:-translate-y-1.5">
                      <Image
                        src={leader.photoUrl}
                        alt={leader.photoAlt || leader.name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        sizes="(max-width: 768px) 128px, 160px"
                      />
                    </div>
                    <h3 className="font-display text-lg md:text-xl font-bold text-stonehill-dark">
                      {leader.name}
                    </h3>
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-600 font-bold mt-1 px-2">
                      {leader.title}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-6 text-slate-900/80 text-base md:text-lg leading-relaxed w-full max-w-xl text-center lg:text-left flex flex-col items-center lg:items-start">
              <p className="whitespace-pre-wrap">{rightParagraph1}</p>
              <p className="whitespace-pre-wrap">{rightParagraph2}</p>
              <Link href="/about" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
                Read More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
