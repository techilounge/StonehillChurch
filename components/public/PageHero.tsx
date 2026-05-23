import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  className?: string;
  headingAs?: "h1" | "h2";
  hasOverlap?: boolean;
}

export function PageHero({
  title,
  subtitle,
  imageUrl,
  imageAlt,
  className,
  headingAs = "h1",
  hasOverlap = false,
}: PageHeroProps) {
  const Heading = headingAs;

  // When overlapped by a negative margin section below (e.g. -mt-16 md:-mt-24),
  // we increase the container height and padding-bottom by 64px (mobile) / 96px (desktop).
  // This keeps the visible portion of the hero exactly at 40vh / min-300px and keeps text centered.
  const heroStyle: React.CSSProperties = hasOverlap
    ? {
        paddingBottom: "var(--overlap-pb, 64px)",
        height: "calc(40vh + var(--overlap-h, 64px))",
        minHeight: "calc(300px + var(--overlap-h, 64px))",
      }
    : {};

  return (
    <section 
      className={cn(
        "relative w-full h-[40vh] min-h-[300px] flex items-center justify-center bg-stonehill-primary", 
        hasOverlap && "[--overlap-pb:64px] md:[--overlap-pb:96px] [--overlap-h:64px] md:[--overlap-h:96px]",
        className
      )}
      style={heroStyle}
    >
      {/* Background Image */}
      {imageUrl && (
        <>
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            fill
            className="object-cover"
            priority
          />
          {/* Overlay for guaranteed text readability against arbitrary photos */}
          <div className="absolute inset-0 bg-slate-900/75" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <Heading className="text-4xl md:text-5xl lg:text-6xl font-bold font-display mb-4 drop-shadow-sm">
          {title}
        </Heading>
        {subtitle && (
          <p className="text-2xl md:text-3xl max-w-2xl mx-auto font-handwritten drop-shadow-sm text-stonehill-accent">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
