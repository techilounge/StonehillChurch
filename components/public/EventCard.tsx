import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Serialized } from "@/lib/data/utils";
import { ChurchEvent } from "@/types/content";
import { Calendar, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/shared/Card";

interface EventCardProps {
  event: Serialized<ChurchEvent>;
}

const knownBrokenEventImagePaths = new Set([
  "https://images.unsplash.com/photo-1490126018903-3a0c0f0a3c43",
]);

function getSafeEventImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return null;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    const imagePath = `${parsedUrl.origin}${parsedUrl.pathname}`;

    return knownBrokenEventImagePaths.has(imagePath) ? null : imageUrl;
  } catch {
    return imageUrl;
  }
}

export function EventCard({ event }: EventCardProps) {
  const startDate = event.startDateTime ? new Date(event.startDateTime) : null;
  const endDate = event.endDateTime ? new Date(event.endDateTime) : null;
  const imageUrl = getSafeEventImageUrl(event.imageUrl);

  const formattedMonth = startDate
    ? startDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
    : "";
  const formattedDay = startDate
    ? startDate.toLocaleDateString("en-US", { day: "2-digit" })
    : "";
    
  const formattedTime = startDate
    ? startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + 
      (endDate ? ` - ${endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : "")
    : "";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
    >
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-300">
        <div className="relative h-48 w-full bg-slate-50 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={event.imageAlt || event.title}
              fill
              className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500/50">
              <Calendar className="w-12 h-12" />
            </div>
          )}
          {/* Date Badge */}
          {startDate && (
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-sm flex flex-col items-center justify-center w-14 h-16 text-center border border-slate-200/50">
              <span className="text-xs font-bold text-stonehill-primary leading-none uppercase">{formattedMonth}</span>
              <span className="text-xl font-bold text-slate-900 leading-none mt-1">{formattedDay}</span>
            </div>
          )}
        </div>

        <CardContent className="p-5 flex flex-col flex-grow">
          <h3 className="text-xl font-bold font-display text-slate-900 mb-3 line-clamp-2 group-hover:text-stonehill-primary transition-colors">
            {event.title}
          </h3>
          
          <div className="mt-auto space-y-2 text-sm text-slate-500">
            {formattedTime && (
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{formattedTime}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
