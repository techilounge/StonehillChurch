"use client";

import React from "react";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveStatus } from "@/components/public/LiveStatusProvider";

interface LiveLabelProps {
  showLiveBanner?: boolean;
}

export function LiveLabel({ showLiveBanner = false }: LiveLabelProps) {
  const { isLive } = useLiveStatus();
  const isLiveActive = isLive || showLiveBanner;

  return (
    <span
      role={isLiveActive ? "status" : undefined}
      aria-label={isLiveActive ? "Live stream currently active" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] transition-all",
        isLiveActive
          ? "bg-red-100 text-red-700 border border-red-200 motion-safe:animate-pulse-glow"
          : "bg-slate-50 text-stonehill-dark border border-transparent",
      )}
    >
      <Radio className="h-3.5 w-3.5" aria-hidden="true" />
      {isLiveActive ? "Live Stream" : "Online Worship"}
      {isLiveActive && (
        <span className="relative flex h-1.5 w-1.5 ml-0.5" aria-hidden="true">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
        </span>
      )}
    </span>
  );
}
