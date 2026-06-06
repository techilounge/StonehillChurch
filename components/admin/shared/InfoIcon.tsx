"use client";

import * as React from "react";
import { Info } from "lucide-react";

type Position = "top" | "right" | "bottom" | "left";

interface InfoIconBaseProps {
  /** Hover/focus tooltip text. Required for `mode="tooltip"`. */
  tooltip?: string;
  /** Popover body. Can be a string or rich content. Required for `mode="popover"`. */
  popover?: React.ReactNode;
  /** Visual placement of the tooltip/popover relative to the icon. */
  position?: Position;
  /** Width override (px) for longer descriptions. Defaults to 240. */
  width?: number;
  /** Accessible label for the trigger button. */
  ariaLabel?: string;
  /** Mode. Defaults to "tooltip" if `tooltip` is provided, else "popover". */
  mode?: "tooltip" | "popover";
  className?: string;
}

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
      <TooltipIcon
        text={tooltip}
        position={position}
        width={width}
        ariaLabel={ariaLabel}
        className={className}
      />
    );
  }

  if (resolvedMode === "popover" && popover) {
    return (
      <PopoverIcon
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

// ---------------------------------------------------------------------------
// Tooltip mode — CSS-only hover/focus + tap-toggle for touch devices.
// ---------------------------------------------------------------------------

interface TooltipIconProps {
  text: string;
  position: Position;
  width: number;
  ariaLabel: string;
  className?: string;
}

function TooltipIcon({ text, position, width, ariaLabel, className }: TooltipIconProps) {
  const [tapOpen, setTapOpen] = React.useState(false);
  const id = React.useId();

  // Clicking outside closes the tap-toggled tooltip (mobile path).
  const wrapperRef = React.useRef<HTMLSpanElement | null>(null);
  React.useEffect(() => {
    if (!tapOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setTapOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTapOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [tapOpen]);

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-flex items-center group ${className ?? ""}`}
    >
      <button
        type="button"
        className="peer inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:text-stonehill-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-1 motion-safe:transition-colors"
        aria-label={ariaLabel}
        aria-describedby={id}
        onClick={(e) => {
          e.preventDefault();
          setTapOpen((v) => !v);
        }}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      <span
        id={id}
        role="tooltip"
        style={{ width }}
        className={[
          "pointer-events-none absolute z-50 rounded-md bg-slate-900 px-3 py-2 text-xs font-normal leading-snug text-white shadow-lg",
          "opacity-0 group-hover:opacity-100 peer-focus-visible:opacity-100",
          tapOpen ? "opacity-100" : "",
          "motion-safe:transition-opacity duration-150",
          positionClass(position),
        ].join(" ")}
      >
        {text}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Popover mode — click toggle with ESC + click-outside close.
// ---------------------------------------------------------------------------

interface PopoverIconProps {
  content: React.ReactNode;
  position: Position;
  width: number;
  ariaLabel: string;
  className?: string;
}

function PopoverIcon({ content, position, width, ariaLabel, className }: PopoverIconProps) {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLSpanElement | null>(null);
  const id = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
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

  return (
    <span ref={wrapperRef} className={`relative inline-flex items-center ${className ?? ""}`}>
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-slate-400 hover:text-stonehill-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-1 motion-safe:transition-colors"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={id}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      {open && (
        <span
          id={id}
          role="dialog"
          style={{ width }}
          className={[
            "absolute z-50 rounded-md border border-slate-200 bg-white p-3 text-xs font-normal leading-snug text-slate-700 shadow-xl",
            // Honor `\n` line breaks in string content so config-authored
            // popovers can split into paragraphs/bullets without HTML.
            typeof content === "string" ? "whitespace-pre-line" : "",
            "motion-safe:animate-in motion-safe:fade-in duration-150",
            positionClass(position),
          ].join(" ")}
        >
          {content}
        </span>
      )}
    </span>
  );
}

function positionClass(position: Position): string {
  switch (position) {
    case "top":
      return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    case "bottom":
      return "top-full left-1/2 -translate-x-1/2 mt-2";
    case "left":
      return "right-full top-1/2 -translate-y-1/2 mr-2";
    case "right":
    default:
      return "left-full top-1/2 -translate-y-1/2 ml-2";
  }
}
