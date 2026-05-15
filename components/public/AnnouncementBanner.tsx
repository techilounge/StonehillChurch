"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AnnouncementBannerProps {
  title: string;
  message: string;
  priority: "low" | "normal" | "high" | "urgent";
  ctaLabel?: string | null;
  ctaHref?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function AnnouncementBanner({
  title,
  message,
  priority,
  ctaLabel,
  ctaHref,
  imageUrl,
  imageAlt,
  dismissible = true,
  onDismiss,
}: AnnouncementBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const bgColors = {
    low: "bg-slate-50 text-slate-900",
    normal: "bg-stonehill-secondary text-slate-900",
    high: "bg-stonehill-accent text-slate-900",
    urgent: "bg-red-700 text-white",
  };

  const Icon = priority === "urgent" || priority === "high" ? AlertTriangle : Info;
  const hasImage = Boolean(imageUrl);

  return (
    <div className={cn("relative px-4 py-3 sm:px-6 lg:px-8", bgColors[priority])}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {hasImage ? (
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-black/10">
              <Image
                src={imageUrl as string}
                alt={imageAlt ?? title}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
          ) : (
            <Icon className="h-5 w-5 flex-shrink-0 opacity-80" aria-hidden="true" />
          )}
          <div className="text-sm font-medium">
            <strong className="mr-2">{title}</strong>
            <span className="opacity-90">{message}</span>
            {ctaLabel && ctaHref && (
              <Link
                href={ctaHref}
                className="ml-2 inline-flex whitespace-nowrap rounded-sm underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              >
                {ctaLabel}
              </Link>
            )}
          </div>
        </div>
        {dismissible && (
          <button
            type="button"
            className="flex-shrink-0 p-1 opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current rounded-sm transition-opacity"
            onClick={() => {
              setIsVisible(false);
              onDismiss?.();
            }}
            aria-label="Dismiss banner"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
