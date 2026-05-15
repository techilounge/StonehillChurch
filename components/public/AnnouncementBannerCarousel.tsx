"use client";

import * as React from "react";
import { AnnouncementBanner } from "./AnnouncementBanner";

const ROTATION_INTERVAL_MS = 6500;
// Half-fade duration. Total perceived transition = FADE_MS (out) + FADE_MS (in).
const FADE_MS = 350;

export type BannerPriority = "low" | "normal" | "high" | "urgent";

export type BannerItem = {
  id: string;
  title: string;
  message: string;
  priority: BannerPriority;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  dismissible?: boolean;
};

type Props = {
  items: BannerItem[];
};

export function AnnouncementBannerCarousel({ items }: Props) {
  const [activeItems, setActiveItems] = React.useState<BannerItem[]>(items);
  // `renderedIndex` is what the user currently sees. `targetIndex` is the
  // slide we're transitioning to. Auto-advance and pagination bumps the
  // target; the fade effect then catches `renderedIndex` up to it.
  const [renderedIndex, setRenderedIndex] = React.useState(0);
  const [targetIndex, setTargetIndex] = React.useState(0);
  const [opacity, setOpacity] = React.useState(1);
  const [paused, setPaused] = React.useState(false);
  const [tabHidden, setTabHidden] = React.useState(false);
  const reducedMotionRef = React.useRef(false);

  // Re-sync when the server-rendered list changes.
  React.useEffect(() => {
    setActiveItems(items);
    setRenderedIndex(0);
    setTargetIndex(0);
    setOpacity(1);
  }, [items]);

  // Read reduced-motion once on mount.
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Pause while the tab isn't visible.
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Auto-advance: bump targetIndex on a cadence.
  React.useEffect(() => {
    if (activeItems.length <= 1) return;
    if (paused || tabHidden) return;

    const timer = window.setInterval(() => {
      setTargetIndex((current) => (current + 1) % activeItems.length);
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [activeItems.length, paused, tabHidden]);

  // Run the fade-out → swap → fade-in choreography whenever the target
  // diverges from what's rendered. Only one banner is ever mounted at a
  // time, so its DOM (including image elements) cannot leak onto another.
  React.useEffect(() => {
    if (targetIndex === renderedIndex) return;

    if (reducedMotionRef.current) {
      setRenderedIndex(targetIndex);
      setOpacity(1);
      return;
    }

    setOpacity(0);
    const swapTimer = window.setTimeout(() => {
      setRenderedIndex(targetIndex);
      setOpacity(1);
    }, FADE_MS);
    return () => window.clearTimeout(swapTimer);
  }, [targetIndex, renderedIndex]);

  const handleDismiss = React.useCallback((id: string) => {
    setActiveItems((prev) => prev.filter((item) => item.id !== id));
    setRenderedIndex(0);
    setTargetIndex(0);
    setOpacity(1);
  }, []);

  if (activeItems.length === 0) return null;

  const safeIndex = Math.min(renderedIndex, activeItems.length - 1);
  const current = activeItems[safeIndex];
  const showsMultiple = activeItems.length > 1;

  return (
    <section
      role={showsMultiple ? "region" : undefined}
      aria-roledescription={showsMultiple ? "carousel" : undefined}
      aria-label={showsMultiple ? "Site announcements" : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        aria-live="polite"
        aria-atomic="true"
        className="motion-safe:transition-opacity"
        style={{
          opacity,
          transitionDuration: `${FADE_MS}ms`,
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <AnnouncementBanner
          key={current.id}
          title={current.title}
          message={current.message}
          priority={current.priority}
          ctaLabel={current.ctaLabel ?? null}
          ctaHref={current.ctaHref ?? null}
          imageUrl={current.imageUrl ?? null}
          imageAlt={current.imageAlt ?? null}
          dismissible={current.dismissible ?? true}
          onDismiss={() => handleDismiss(current.id)}
        />
      </div>
    </section>
  );
}
