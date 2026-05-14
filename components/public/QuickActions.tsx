import React from "react";
import Link from "next/link";
import { 
  MapPin, 
  Video, 
  BookOpen, 
  HeartHandshake, 
  FileText, 
  CreditCard 
} from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";

const actions = [
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

export function QuickActions() {
  return (
    <section className="py-12 bg-white sm:py-16 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader 
          title="Quick Links" 
          eyebrow="Connect"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mt-8">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-stonehill-accent hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
            >
              <div className="mb-4 rounded-full bg-stonehill-primary/10 p-3 text-stonehill-primary transition-colors group-hover:bg-stonehill-accent/20 group-hover:text-stonehill-accent">
                <action.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                {action.title}
              </h3>
              <p className="mt-1 hidden text-xs text-slate-900/70 sm:block">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
