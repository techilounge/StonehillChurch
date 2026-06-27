"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import type { Serialized } from "@/lib/data/homepage";
import type { HomepageSlide } from "@/types/content";
import { useLiveStatus } from "@/components/public/LiveStatusProvider";

interface HeroCarouselProps {
  slides: Serialized<HomepageSlide>[];
  isLive?: boolean;
}

const isWatchLive = (label?: string | null) => label?.toLowerCase().trim() === "watch live";

function normalizeOverlayOpacity(value: number | null | undefined) {
  const raw = typeof value === "number" && Number.isFinite(value) ? value : 0.45;
  const decimal = raw > 1 ? raw / 100 : raw;

  return Math.min(Math.max(decimal, 0.25), 0.85);
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const { isLive } = useLiveStatus();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: reducedMotion ? 0 : 40 },
    [
      Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }),
      Fade()
    ]
  );
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollNext();
    }
  }, [scrollPrev, scrollNext]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  if (!slides || slides.length === 0) {
    return (
      <div className="relative w-full h-[60vh] min-h-[500px] bg-stonehill-primary flex items-center justify-center text-center px-4">
        <div className="absolute inset-0 bg-slate-900/40 z-10" />
        <div className="relative z-20 max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
            Welcome to Stonehill SDA Church
          </h1>
          <p className="font-handwritten text-3xl md:text-4xl text-stonehill-accent max-w-2xl mx-auto">
            A place to belong, grow, and serve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full group"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured slides"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y" aria-live="polite" aria-atomic="true">
          {slides.map((slide, index) => (
            <div 
              key={slide.id} 
              className="relative flex-[0_0_100%] min-w-0 h-[60vh] min-h-[500px] bg-stonehill-primary"
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${slides.length}`}
            >
              {slide.imageUrl ? (
                <Image
                  src={slide.imageUrl}
                  alt={slide.imageAlt || slide.title}
                  fill
                  priority={index === 0}
                  className="object-cover"
                  sizes="100vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-stonehill-primary via-stonehill-primary to-slate-900" />
              )}
              <div 
                className="absolute inset-0 z-10" 
                style={{ backgroundColor: `rgba(0, 0, 0, ${normalizeOverlayOpacity(slide.overlayOpacity)})` }}
              />
              <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-4">
                <div className="max-w-4xl mx-auto space-y-6">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
                    {slide.title}
                  </h1>
                  <p className="font-handwritten text-3xl md:text-4xl text-stonehill-accent max-w-2xl mx-auto drop-shadow-lg">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    {slide.primaryCtaLabel && slide.primaryCtaHref && (() => {
                      const isLiveBtn = isLive && isWatchLive(slide.primaryCtaLabel);
                      return (
                        <Link
                          href={slide.primaryCtaHref}
                          aria-label={isLiveBtn ? `${slide.primaryCtaLabel} — Live stream currently active` : undefined}
                          className={cn(
                            buttonVariants({ variant: "default", size: "lg" }),
                            isLiveBtn
                              ? "bg-red-600 text-white border-red-600 hover:bg-red-700 hover:text-white transition-colors motion-safe:animate-pulse-glow"
                              : "bg-[#FFBD11] text-white hover:bg-[#FFBD11]/90 border-none"
                          )}
                        >
                          {isLiveBtn && (
                            <span className="mr-1.5 inline-flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                              </span>
                              Live
                            </span>
                          )}
                          {slide.primaryCtaLabel}
                        </Link>
                      );
                    })()}
                    {slide.secondaryCtaLabel && slide.secondaryCtaHref && (() => {
                      const isLiveBtn = isLive && isWatchLive(slide.secondaryCtaLabel);
                      return (
                        <Link
                          href={slide.secondaryCtaHref}
                          aria-label={isLiveBtn ? `${slide.secondaryCtaLabel} — Live stream currently active` : undefined}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "lg" }),
                            isLiveBtn
                              ? "bg-red-600 text-white border-red-600 hover:bg-red-700 hover:text-white transition-colors motion-safe:animate-pulse-glow"
                              : "bg-white/10 text-white border-white/30 backdrop-blur-sm hover:bg-white/20"
                          )}
                        >
                          {isLiveBtn && (
                            <span className="mr-1.5 inline-flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                              </span>
                              Live
                            </span>
                          )}
                          {slide.secondaryCtaLabel}
                        </Link>
                      );
                    })()}
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40 disabled:opacity-0"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/40 disabled:opacity-0"
            aria-label="Next slide"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}
    </div>
  );
}
