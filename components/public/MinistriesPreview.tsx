import React from "react";
import Link from "next/link";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import { MinistryCard } from "./MinistryCard";
import type { Serialized } from "@/lib/data/homepage";
import type { Ministry } from "@/types/content";

interface MinistriesPreviewProps {
  ministries: Serialized<Ministry>[];
}

export function MinistriesPreview({ ministries }: MinistriesPreviewProps) {
  if (!ministries || ministries.length === 0) {
    return (
      <section className="py-16 bg-white sm:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-stonehill-primary sm:text-4xl mb-4">
            Find Your Place
          </h2>
          <p className="text-lg text-slate-900/80 mb-8 max-w-2xl mx-auto">
            We have ministries for every age and stage of life. Discover how you can get involved, 
            grow in your faith, and serve others.
          </p>
          <Link href="/ministries" className={cn(buttonVariants({ size: "lg" }))}>
            Explore All Ministries
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-stonehill-primary sm:text-4xl mb-4">
              Find Your Place
            </h2>
            <p className="text-lg text-slate-900/80">
              There&apos;s a place for everyone at Stonehill. Browse our featured ministries below or 
              explore all the ways you can get connected.
            </p>
          </div>
          <Link 
            href="/ministries" 
            className={cn(buttonVariants({ variant: "outline" }), "hidden md:inline-flex whitespace-nowrap")}
          >
            View All Ministries
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ministries.map((ministry) => (
            <MinistryCard key={ministry.id} ministry={ministry} />
          ))}
        </div>
        
        <div className="mt-10 md:hidden flex justify-center">
          <Link href="/ministries" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
            View All Ministries
          </Link>
        </div>
      </div>
    </section>
  );
}
