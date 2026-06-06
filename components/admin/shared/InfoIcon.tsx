"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

type Position = "top" | "right" | "bottom" | "left";

interface InfoIconBaseProps {
  /** Hover/focus tooltip text. Required for `mode="tooltip"`. */
  tooltip?: string;
  /** Popover body. Can be a string or rich content. Required for `mode="popover"`. */
  popover?: React.ReactNode;
  /** Preferred placement; auto-flips if there isn't room on that side. */
  position?: Position;
  /** Width (px) for the floating panel. Defaults to 240. */
  width?: number;
  /** Accessible label for the trigger button. */
  ariaLabel?: string;
  /** Mode. Defaults to "tooltip" if `tooltip` is provided, else "popover". */
  mode?: "tooltip" | "popover";
  className?: string;
}

const VIEWPORT_PADDING = 8;
const GAP = 8;

export function InfoIcon({
  tooltip,
  popover,
  position = "top",
  width = 240,
  ariaLabel = "More information",
  mode,
  className,
}: InfoIconBaseProps) {
  const resolvedMode: "tooltip" | "popover" = mode ?? (tooltip ? "tooltip" : "popover");

  if (resolvedMode === "tooltip" && tooltip) {
    return (
      <FloatingIcon
        kind="tooltip"
        content={tooltip}
        position={position}
        width={width}
        ariaLabel={ariaLabel}
        className={className}
      />
    );
  }

  if (resolvedMode === "popover" && popover) {
    return (
      <FloatingIcon
        kind="popover"
        content={popover}
        position={position}
        width={width}
        ariaLabel={ariaLabel}
        className={className}
      />
    );
  }

  return null;
}

interface FloatingIconProps {
  kind: "tooltip" | "popover";
  content: React.ReactNode;
  position: Position;
  width: number;
  ariaLabel: string;
  className?: string;
}

function FloatingIcon({
  kind,
  content,
  position,
  width,
  ariaLabel,
  className,
}: FloatingIconProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = React.useState<{
    left: number;
    top: number;
    side: Position;
  } | null>(null);
  const id = React.useId();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Click-outside + ESC for popover. Tooltip closes on mouseleave/blur, so
  // these listeners only run when explicitly opened by click (kind=popover or
  // a tap-toggled tooltip on touch devices).
  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // Recompute panel coordinates whenever it opens, scrolls, or resizes.
  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setCoords(null);
      return;
    }
    const update = () => {
      if (!triggerRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      // Panel height is unknown before render. Measure if already rendered;
      // otherwise estimate (60 for short tooltips, 160 for popovers).
      const measuredHeight = panelRef.current?.getBoundingClientRect().height;
      const height = measuredHeight ?? (kind === "popover" ? 160 : 60);
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      setCoords(computePlacement(triggerRect, width, height, position, viewport));
    };
    update();
    // A second pass after the panel actually paints — picks up the true height
    // so multi-line popovers don't overlap the trigger.
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, position, width, kind]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen((v) => !v);
  };

  const tooltipHoverProps =
    kind === "tooltip"
      ? {
          onMouseEnter: () => setOpen(true),
          onMouseLeave: () => setOpen(false),
          onFocus: () => setOpen(true),
          onBlur: () => setOpen(false),
        }
      : {};

  return (
    <span className={`relative inline-flex items-center ${className ?? ""}`} {...tooltipHoverProps}>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:text-stonehill-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-1 motion-safe:transition-colors"
        aria-label={ariaLabel}
        aria-describedby={kind === "tooltip" && open ? id : undefined}
        aria-expanded={kind === "popover" ? open : undefined}
        aria-controls={kind === "popover" ? id : undefined}
        onClick={handleTriggerClick}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      {mounted && open && coords &&
        createPortal(
          <div
            ref={panelRef}
            id={id}
            role={kind === "tooltip" ? "tooltip" : "dialog"}
            style={{
              position: "fixed",
              left: coords.left,
              top: coords.top,
              width,
              zIndex: 1000,
            }}
            className={
              kind === "tooltip"
                ? "pointer-events-none rounded-md bg-slate-900 px-3 py-2 text-xs font-normal leading-snug text-white shadow-lg motion-safe:transition-opacity duration-150"
                : [
                    "rounded-md border border-slate-200 bg-white p-3 text-xs font-normal leading-snug text-slate-700 shadow-xl",
                    typeof content === "string" ? "whitespace-pre-line" : "",
                  ].join(" ")
            }
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}

function computePlacement(
  triggerRect: DOMRect,
  width: number,
  height: number,
  preferred: Position,
  viewport: { w: number; h: number },
): { left: number; top: number; side: Position } {
  const order: Position[] = [preferred, ...(["top", "bottom", "right", "left"] as Position[]).filter((p) => p !== preferred)];

  for (const side of order) {
    const candidate = positionFor(side, triggerRect, width, height);
    if (fitsInViewport(candidate, width, height, viewport)) {
      return { ...clampHorizontally(candidate, width, viewport), side };
    }
  }

  // Nothing fit; clamp the preferred candidate into the viewport so the
  // panel is at least visible.
  const fallback = positionFor(preferred, triggerRect, width, height);
  const clampedH = clampHorizontally(fallback, width, viewport);
  const top = Math.max(
    VIEWPORT_PADDING,
    Math.min(viewport.h - height - VIEWPORT_PADDING, clampedH.top),
  );
  return { left: clampedH.left, top, side: preferred };
}

function positionFor(
  side: Position,
  rect: DOMRect,
  width: number,
  height: number,
): { left: number; top: number } {
  switch (side) {
    case "top":
      return {
        left: rect.left + rect.width / 2 - width / 2,
        top: rect.top - height - GAP,
      };
    case "bottom":
      return {
        left: rect.left + rect.width / 2 - width / 2,
        top: rect.bottom + GAP,
      };
    case "left":
      return {
        left: rect.left - width - GAP,
        top: rect.top + rect.height / 2 - height / 2,
      };
    case "right":
    default:
      return {
        left: rect.right + GAP,
        top: rect.top + rect.height / 2 - height / 2,
      };
  }
}

function fitsInViewport(
  pos: { left: number; top: number },
  width: number,
  height: number,
  viewport: { w: number; h: number },
): boolean {
  return (
    pos.left >= VIEWPORT_PADDING &&
    pos.left + width <= viewport.w - VIEWPORT_PADDING &&
    pos.top >= VIEWPORT_PADDING &&
    pos.top + height <= viewport.h - VIEWPORT_PADDING
  );
}

function clampHorizontally(
  pos: { left: number; top: number },
  width: number,
  viewport: { w: number; h: number },
): { left: number; top: number } {
  const left = Math.max(
    VIEWPORT_PADDING,
    Math.min(viewport.w - width - VIEWPORT_PADDING, pos.left),
  );
  return { left, top: pos.top };
}
