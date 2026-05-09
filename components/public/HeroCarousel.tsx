"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import type { Serialized } from "@/lib/data/homepage";
import type { HomepageSlide } from "@/types/content";

interface HeroCarouselProps {
  slides: Serialized<HomepageSlide>[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (!slides || slides.length === 0) {
    return (
      <div className="relative w-full h-[60vh] min-h-[500px] bg-stonehill-evergreen flex items-center justify-center text-center px-4">
        <div className="absolute inset-0 bg-stonehill-ink/40 z-10" />
        <div className="relative z-20 max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Welcome to Stonehill
          </h1>
          <p className="text-xl text-stonehill-cream/90 max-w-2xl mx-auto">
            A place to belong, grow, and serve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map((slide) => (
            <div key={slide.id} className="relative flex-[0_0_100%] min-w-0 h-[60vh] min-h-[500px]">
              <Image
                src={slide.imageUrl || "/placeholder-hero.jpg"}
                alt={slide.imageAlt || slide.title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
              <div 
                className="absolute inset-0 z-10" 
                style={{ backgroundColor: `rgba(0, 0, 0, ${(slide.overlayOpacity || 40) / 100})` }}
              />
              <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-4">
                <div className="max-w-4xl mx-auto space-y-6">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white drop-shadow-sm">
                    {slide.title}
                  </h1>
                  <p className="text-xl text-stonehill-cream/90 max-w-2xl mx-auto drop-shadow-sm">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    {slide.primaryCtaLabel && slide.primaryCtaHref && (
                      <Link
                        href={slide.primaryCtaHref}
                        className={cn(buttonVariants({ variant: "default", size: "lg" }))}
                      >
                        {slide.primaryCtaLabel}
                      </Link>
                    )}
                    {slide.secondaryCtaLabel && slide.secondaryCtaHref && (
                      <Link
                        href={slide.secondaryCtaHref}
                        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "bg-transparent text-white border-white hover:bg-white hover:text-stonehill-ink")}
                      >
                        {slide.secondaryCtaLabel}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40 disabled:opacity-0"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40 disabled:opacity-0"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
}
