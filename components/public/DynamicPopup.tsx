"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveVideoEmbed } from "@/lib/popup/video";
import { isPopupActiveAt } from "@/lib/popup/scheduling";
import {
  isPopupAllowedByFrequency,
  markPopupShown,
  type FrequencyStorage,
} from "@/lib/popup/frequency";
import type { Serialized } from "@/lib/data/utils";
import type {
  Popup,
  PopupBackdropStyle,
  PopupCaptionAlignment,
  PopupHeightPreset,
  PopupTriggerType,
  PopupWidthPreset,
} from "@/types/popup";

type Props = {
  popup: Serialized<Popup>;
};

const WIDTH_PRESET_CLASS: Record<PopupWidthPreset, string> = {
  auto: "sm:max-w-fit",
  small: "sm:max-w-md",
  medium: "sm:max-w-2xl",
  large: "sm:max-w-[90vw]",
};

const HEIGHT_PRESET_CLASS: Record<PopupHeightPreset, string> = {
  auto: "max-h-[90vh]",
  fit: "max-h-[90vh]",
  scroll: "max-h-[90vh] overflow-y-auto",
};

const CAPTION_ALIGN_CLASS: Record<PopupCaptionAlignment, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function backdropClass(style: PopupBackdropStyle): string {
  switch (style) {
    case "blur":
      return "backdrop-blur-md";
    case "gradient":
      return "";
    case "solid":
    default:
      return "";
  }
}

function backdropInlineStyle(
  style: PopupBackdropStyle,
  opacity: number,
  blur: number,
): React.CSSProperties {
  if (style === "blur") {
    return {
      backgroundColor: `rgba(15, 23, 42, ${Math.min(1, Math.max(0, opacity))})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
    };
  }
  if (style === "gradient") {
    const o = Math.min(1, Math.max(0, opacity));
    return {
      backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, ${o}) 0%, rgba(13, 71, 92, ${o}) 100%)`,
    };
  }
  return {
    backgroundColor: `rgba(15, 23, 42, ${Math.min(1, Math.max(0, opacity))})`,
  };
}

// Wrap localStorage so storage-blocked environments (Safari private mode,
// disabled cookies) degrade to "no record" rather than throwing. Falls back
// to document.cookie for getItem if localStorage is unavailable, matching
// the spec's "Use localStorage (preferred). Fallback to cookies if needed."
function getBrowserFrequencyStorage(): FrequencyStorage | null {
  if (typeof window === "undefined") return null;

  let ls: Storage | null = null;
  try {
    // Touching localStorage can throw in sandboxed iframes / disabled storage.
    ls = window.localStorage;
    // Probe write — some browsers expose localStorage but reject writes.
    const probe = "__sh_probe__";
    ls.setItem(probe, "1");
    ls.removeItem(probe);
  } catch {
    ls = null;
  }

  if (ls) {
    return {
      getItem: (k) => {
        try {
          return ls!.getItem(k);
        } catch {
          return null;
        }
      },
      setItem: (k, v) => {
        try {
          ls!.setItem(k, v);
        } catch {
          // Swallow — overflowed quota / locked storage.
        }
      },
    };
  }

  // Cookie fallback. Keep it minimal: month-long retention, root path. We
  // never need to delete from here; the admin re-keys by changing the popup
  // id when they want everyone to see a fresh version.
  return {
    getItem: (k) => {
      const target = `${encodeURIComponent(k)}=`;
      const found = document.cookie
        .split("; ")
        .find((row) => row.startsWith(target));
      return found ? decodeURIComponent(found.slice(target.length)) : null;
    },
    setItem: (k, v) => {
      const oneYear = 60 * 60 * 24 * 365;
      document.cookie = `${encodeURIComponent(k)}=${encodeURIComponent(v)}; Max-Age=${oneYear}; Path=/; SameSite=Lax`;
    },
  };
}

export function DynamicPopup({ popup }: Props) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [animateIn, setAnimateIn] = React.useState(false);
  // Server-side `getActivePopup()` already filters by Start/End time, but
  // (a) Next.js may have cached the parent layout HTML and (b) the popup's
  // window may elapse while the user is on the page. Track schedule state
  // on the client and stop rendering when it goes false. Default to `true`
  // so the initial client render matches what the server sent (no hydration
  // mismatch); the effect below corrects it within a tick.
  const [scheduleActive, setScheduleActive] = React.useState(true);
  // `frequencyReady` gates trigger rendering: we don't know whether the popup
  // is allowed to display until we've checked browser storage post-hydration.
  // Rendering the trigger pre-check would flicker when the popup turns out
  // to be suppressed (spec: "No flicker or layout shift when popup is
  // suppressed").
  const [frequencyReady, setFrequencyReady] = React.useState(false);
  const [frequencyAllowed, setFrequencyAllowed] = React.useState(false);
  const storageRef = React.useRef<FrequencyStorage | null>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();
  const captionId = React.useId();

  const triggerType: PopupTriggerType = popup.triggerType ?? "button";
  const triggerLabel = popup.triggerLabel?.trim() || popup.title || "Open";
  // When a startTime is set, the popup is "scheduled": getActivePopup() only
  // returns it inside its window, and per spec the schedule itself is the
  // trigger — no on-page button/link/image is rendered.
  const isScheduled = Boolean(popup.startTime);

  const frequencyConfig = React.useMemo(
    () => ({
      id: popup.id,
      frequencyMode: popup.frequencyMode ?? "every",
      frequencyIntervalValue: popup.frequencyIntervalValue ?? null,
      frequencyIntervalUnit: popup.frequencyIntervalUnit ?? null,
    }),
    [
      popup.id,
      popup.frequencyMode,
      popup.frequencyIntervalValue,
      popup.frequencyIntervalUnit,
    ],
  );

  // One-shot storage check on mount. Storage isn't a reactive source, so we
  // don't need to re-evaluate as the user navigates within the SPA — the
  // layout-level mount of this component already aligns with what the spec
  // calls a "qualifying" visit.
  React.useEffect(() => {
    const storage = getBrowserFrequencyStorage();
    storageRef.current = storage;
    const allowed = storage
      ? isPopupAllowedByFrequency(frequencyConfig, storage, Date.now())
      : true; // No storage = can't suppress; show the popup.
    setFrequencyAllowed(allowed);
    setFrequencyReady(true);
  }, [frequencyConfig]);

  // Re-evaluate the Start/End window against the client's clock and arm a
  // one-shot timer to auto-close when endTime arrives mid-session.
  React.useEffect(() => {
    const recheck = () => {
      setScheduleActive(
        isPopupActiveAt(
          { startTime: popup.startTime, endTime: popup.endTime },
          Date.now(),
        ),
      );
    };
    recheck();

    if (!popup.endTime) return;
    const remaining = new Date(popup.endTime).getTime() - Date.now();
    // Guard against past times and setTimeout's 32-bit max delay (~24.8 days).
    if (remaining <= 0 || remaining > 2_147_483_000) return;
    const timer = window.setTimeout(recheck, remaining + 250);
    return () => window.clearTimeout(timer);
  }, [popup.startTime, popup.endTime]);

  const open = React.useCallback(() => {
    // Re-check at open time. For manual triggers the user may have clicked
    // after the cooldown elapsed; for scheduled flows this is a no-op.
    const storage = storageRef.current;
    if (storage) {
      if (!isPopupAllowedByFrequency(frequencyConfig, storage, Date.now())) {
        return;
      }
      markPopupShown(frequencyConfig, storage, Date.now());
    }
    triggerRef.current = document.activeElement as HTMLElement | null;
    setMounted(true);
    setIsOpen(true);
  }, [frequencyConfig]);

  const close = React.useCallback(() => {
    setAnimateIn(false);
    const t = window.setTimeout(() => {
      setIsOpen(false);
      setMounted(false);
      const trigger = triggerRef.current;
      if (trigger && typeof trigger.focus === "function") {
        trigger.focus();
      }
    }, Math.max(100, popup.animationDurationMs ?? 250));
    return () => window.clearTimeout(t);
  }, [popup.animationDurationMs]);

  // Trigger enter animation on next frame after mount so transition runs.
  React.useEffect(() => {
    if (!mounted) return;
    const raf = window.requestAnimationFrame(() => setAnimateIn(true));
    return () => window.cancelAnimationFrame(raf);
  }, [mounted]);

  // Scheduled popups auto-open on first render — but only after the
  // frequency check completes and only if frequency allows it. The schedule
  // window itself was already enforced server-side by getActivePopup().
  React.useEffect(() => {
    if (!isScheduled) return;
    if (!frequencyReady) return;
    if (!frequencyAllowed) return;
    open();
  }, [isScheduled, frequencyReady, frequencyAllowed, open]);

  // Lock body scroll while open.
  React.useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // ESC to close + focus trap.
  React.useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  // Move focus into the dialog when it opens.
  React.useEffect(() => {
    if (!animateIn) return;
    closeButtonRef.current?.focus();
  }, [animateIn]);

  const widthClass = WIDTH_PRESET_CLASS[popup.widthPreset ?? "medium"];
  const heightClass = HEIGHT_PRESET_CLASS[popup.heightPreset ?? "auto"];
  const captionAlignClass = CAPTION_ALIGN_CLASS[popup.captionAlignment ?? "center"];

  const video = resolveVideoEmbed(popup.videoUrl ?? null, {
    autoplay: popup.videoAutoplay ?? false,
    muted: popup.videoMuted ?? true,
    loop: popup.videoLoop ?? false,
  });
  const showCaption = popup.captionShow && Boolean(popup.captionText?.trim());

  const animationStyle = popup.animationStyle ?? "fade-scale";
  const transitionDuration = `${Math.max(100, popup.animationDurationMs ?? 250)}ms`;
  const baseTransform =
    animationStyle === "fade"
      ? "none"
      : animationStyle === "scale"
        ? "scale(0.94)"
        : "scale(0.96)";
  const dialogStyle: React.CSSProperties = {
    transitionDuration,
    opacity: animateIn ? 1 : animationStyle === "scale" ? 1 : 0,
    transform: animateIn ? "none" : baseTransform,
  };

  const renderTrigger = () => {
    if (triggerType === "image" && popup.imageUrl) {
      return (
        <button
          type="button"
          onClick={open}
          className="group inline-flex max-w-full overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
          aria-label={triggerLabel}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={popup.imageUrl}
            alt={popup.imageAlt ?? ""}
            loading="lazy"
            className="h-24 w-24 rounded-lg object-cover motion-safe:transition motion-safe:group-hover:scale-105"
          />
        </button>
      );
    }
    if (triggerType === "link") {
      return (
        <button
          type="button"
          onClick={open}
          className="font-sans text-sm font-medium text-stonehill-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
        >
          {triggerLabel}
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center justify-center rounded-full bg-stonehill-primary px-5 py-2.5 font-sans text-sm font-semibold text-white shadow-md motion-safe:transition hover:bg-stonehill-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
      >
        {triggerLabel}
      </button>
    );
  };

  // Manual trigger rendering rules:
  //   • scheduled popups never render a trigger (auto-open is the trigger)
  //   • pre-hydration we render nothing to avoid a frame where the button
  //     appears and then disappears when frequency turns out to suppress it
  //   • post-hydration we render only if frequency currently allows opening
  const showManualTrigger = !isScheduled && frequencyReady && frequencyAllowed;

  // Defense-in-depth: even if a stale cache served this popup past its
  // window, the client refuses to render it. Auto-open and trigger render
  // both fall through to nothing.
  if (!scheduleActive) return null;

  return (
    <>
      {showManualTrigger && (
        <div className="fixed bottom-6 right-6 z-40 print:hidden">
          {renderTrigger()}
        </div>
      )}

      {mounted && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={showCaption ? captionId : undefined}
        >
          <button
            type="button"
            aria-label="Close popup"
            onClick={close}
            className={cn(
              "absolute inset-0 motion-safe:transition-opacity",
              backdropClass(popup.backdropStyle ?? "solid"),
            )}
            style={{
              ...backdropInlineStyle(
                popup.backdropStyle ?? "solid",
                popup.backdropOpacity ?? 0.6,
                popup.backdropBlur ?? 0,
              ),
              transitionDuration,
              opacity: animateIn ? 1 : 0,
            }}
            tabIndex={-1}
          />

          <div
            ref={dialogRef}
            className={cn(
              "relative flex w-full flex-col bg-white shadow-2xl motion-safe:transition-all",
              "h-full sm:h-auto sm:w-auto sm:rounded-2xl",
              widthClass,
              heightClass,
            )}
            style={dialogStyle}
          >
            <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-5 sm:px-6 sm:pt-6">
              <h2
                id={titleId}
                className="font-display text-xl text-stonehill-primary sm:text-2xl"
              >
                {popup.title}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label="Close popup"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 motion-safe:transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              {popup.mediaType === "image" && popup.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={popup.imageUrl}
                  alt={popup.imageAlt ?? ""}
                  loading="lazy"
                  className="h-auto w-full rounded-lg object-contain"
                />
              ) : null}

              {popup.mediaType === "video" && video ? (
                <div
                  className={cn(
                    "overflow-hidden rounded-lg bg-slate-900",
                    popup.videoMaintain16x9 ? "aspect-video" : "",
                  )}
                >
                  {video.kind === "file" ? (
                    <video
                      src={video.src}
                      controls
                      autoPlay={popup.videoAutoplay}
                      muted={popup.videoMuted}
                      loop={popup.videoLoop}
                      playsInline
                      className={cn(
                        "h-full w-full",
                        popup.videoMaintain16x9 ? "object-cover" : "object-contain",
                      )}
                    />
                  ) : (
                    <iframe
                      src={video.src}
                      title={popup.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  )}
                </div>
              ) : null}

              {showCaption ? (
                <p
                  id={captionId}
                  className={cn(
                    "mt-4 font-sans text-sm text-slate-700",
                    captionAlignClass,
                  )}
                >
                  {popup.captionText}
                </p>
              ) : null}
            </div>
          </div>

          <span className="sr-only" aria-live="polite">
            {`${popup.title} dialog opened.`}
          </span>
        </div>
      )}
    </>
  );
}
