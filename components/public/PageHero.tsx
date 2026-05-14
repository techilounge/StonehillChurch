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
}

export function PageHero({
  title,
  subtitle,
  imageUrl,
  imageAlt,
  className,
  headingAs = "h1",
}: PageHeroProps) {
  const Heading = headingAs;

  return (
    <section className={cn("relative w-full h-[40vh] min-h-[300px] flex items-center justify-center bg-stonehill-primary", className)}>
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
