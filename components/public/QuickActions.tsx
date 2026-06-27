"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Video,
  BookOpen,
  HeartHandshake,
  FileText,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useLiveStatus } from "@/components/public/LiveStatusProvider";

type QuickAction = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

const actions: QuickAction[] = [
  {
    title: "Plan Your Visit",
    href: "/plan-your-visit",
    icon: MapPin,
    description: "Join us this Sabbath",
  },
  {
    title: "Watch Live",
    href: "/live",
    icon: Video,
    description: "Stream our service",
  },
  {
    title: "Latest Sermons",
    href: "/sermons",
    icon: BookOpen,
    description: "Catch up on messages",
  },
  {
    title: "Prayer Request",
    href: "/prayer-request",
    icon: HeartHandshake,
    description: "How can we pray for you?",
  },
  {
    title: "Church Bulletin",
    href: "/church-bulletin",
    icon: FileText,
    description: "This week's updates",
  },
  {
    title: "Give Online",
    href: "/give",
    icon: CreditCard,
    description: "Support our ministry",
  },
];

const DEFAULT_CARD_CLASS =
  "group relative flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-stonehill-accent hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2";

const LIVE_CARD_CLASS =
  "group relative flex flex-col items-center justify-center rounded-2xl border border-red-700 bg-gradient-to-br from-red-600 to-red-700 p-6 text-center shadow-md shadow-red-500/30 transition-all duration-300 motion-safe:hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 motion-safe:animate-pulse-glow";

export interface QuickActionsProps {
  isLive?: boolean;
}

export function QuickActions({ isLive: initialIsLive = false }: QuickActionsProps) {
  const { isLive } = useLiveStatus();
  return (
    <section className="py-12 bg-white sm:py-16 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title="Quick Links" eyebrow="Connect" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mt-8">
          {actions.map((action) => {
            const showLive = isLive && action.title === "Watch Live";
            return (
              <Link
                key={action.title}
                href={action.href}
                aria-label={
                  showLive
                    ? `${action.title} — live stream currently active`
                    : undefined
                }
                className={showLive ? LIVE_CARD_CLASS : DEFAULT_CARD_CLASS}
              >
                {showLive && <LiveBadge />}
                <div
                  className={
                    showLive
                      ? "mb-4 rounded-full bg-white/20 p-3 text-white transition-colors"
                      : "mb-4 rounded-full bg-stonehill-primary/10 p-3 text-stonehill-primary transition-colors group-hover:bg-stonehill-accent/20 group-hover:text-stonehill-accent"
                  }
                >
                  <action.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3
                  className={
                    showLive
                      ? "text-sm font-semibold text-white sm:text-base"
                      : "text-sm font-semibold text-slate-900 sm:text-base"
                  }
                >
                  {action.title}
                </h3>
                <p
                  className={
                    showLive
                      ? "mt-1 hidden text-xs text-white/90 sm:block"
                      : "mt-1 hidden text-xs text-slate-900/70 sm:block"
                  }
                >
                  {showLive ? "Streaming now" : action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LiveBadge() {
  return (
    <span
      role="status"
      aria-label="Live stream currently active"
      className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-red-900/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ring-1 ring-white/30"
    >
      <span className="relative inline-flex h-2 w-2">
        <span
          aria-hidden="true"
          className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 motion-safe:animate-ping"
        />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      Live
    </span>
  );
}
