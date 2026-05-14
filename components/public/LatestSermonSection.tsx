import React from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import { SermonCard } from "./SermonCard";
import type { Serialized } from "@/lib/data/homepage";
import type { Sermon } from "@/types/content";

interface LatestSermonSectionProps {
  sermon: Serialized<Sermon> | null;
}

export function LatestSermonSection({ sermon }: LatestSermonSectionProps) {
  if (!sermon) {
    return (
      <section className="py-16 bg-slate-50 sm:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-stonehill-primary sm:text-4xl">
            Latest Sermon
          </h2>
          <p className="mt-6 text-lg text-slate-900/80">
            Sermons coming soon.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-slate-50 sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-stonehill-primary sm:text-4xl mb-4">
              Watch Our Latest Sermon
            </h2>
            <p className="text-lg text-slate-900/80 mb-8">
              Can&apos;t make it in person? You can still be part of our worship experience. 
              Watch our latest message or join us live every Sabbath morning.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10 lg:mb-0">
              <Link 
                href="/live" 
                className={cn(buttonVariants({ size: "lg" }), "bg-red-600 hover:bg-red-700 text-white border-none")}
              >
                <PlayCircle className="w-5 h-5 mr-2" />
                Watch Live
              </Link>
              <Link 
                href="/sermons" 
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Browse Sermon Library
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <SermonCard sermon={sermon} />
          </div>
        </div>
      </div>
    </section>
  );
}
