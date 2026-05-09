import React from "react";
import Image from "next/image";

interface PageHeroProps {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  className?: string;
}

export function PageHero({
  title,
  subtitle,
  imageUrl,
  imageAlt,
  className = "",
}: PageHeroProps) {
  return (
    <section className={`relative w-full h-[40vh] min-h-[300px] flex items-center justify-center ${className}`}>
      {/* Background Image or Color */}
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            fill
            className="object-cover"
            priority
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-stone-900/60 mix-blend-multiply" />
        </>
      ) : (
        <div className="absolute inset-0 bg-stone-800" />
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif mb-4 drop-shadow-md">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl max-w-2xl mx-auto font-light drop-shadow">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
