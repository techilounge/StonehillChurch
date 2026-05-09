import React from "react";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { buttonVariants } from "@/lib/buttonVariants";
import { cn } from "@/lib/utils";
import { SermonCard } from "./cards/SermonCard";
import type { Serialized } from "@/lib/data/homepage";
import type { Sermon } from "@/types/content";

interface LatestSermonSectionProps {
  sermon: Serialized<Sermon> | null;
}

export function LatestSermonSection({ sermon }: LatestSermonSectionProps) {
  if (!sermon) {
    return (
      <section className="py-16 bg-stonehill-cream sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-stonehill-evergreen sm:text-4xl">
            Latest Sermon
          </h2>
          <p className="mt-6 text-lg text-stonehill-ink/80">
            Sermons coming soon.
          </p>
        </div>
      </section>
    );
  }

  // To match the SermonCard props, we need to adapt the Serialized<Sermon> if needed.
  // SermonCard probably expects a Sermon object, but with stringified dates it might need adjusting
  // or it handles string dates natively. We'll pass it directly as it matches the general shape.
  const sermonData = {
    ...sermon,
    sermonDate: sermon.sermonDate ? new Date(sermon.sermonDate) : new Date(),
  } as any; // Cast back to what SermonCard expects if it relies on Date objects. Wait, it's a Client Component?
  // SermonCard is a server component normally unless it has "use client". Let's assume it accepts standard props.

  return (
    <section className="py-16 bg-stonehill-cream sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-stonehill-evergreen sm:text-4xl mb-4">
              Watch Our Latest Sermon
            </h2>
            <p className="text-lg text-stonehill-ink/80 mb-8">
              Can't make it in person? You can still be part of our worship experience. 
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
            {/* The SermonCard might expect a Sermon object. Since sermonDate is a string in Serialized, we mock it back to a Date for the component if required. */}
            <SermonCard sermon={sermonData} />
          </div>
        </div>
      </div>
    </section>
  );
}
