import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Serialized } from "@/lib/data/utils";
import { ChurchEvent } from "@/types/content";
import { Calendar, MapPin, Clock } from "lucide-react";

interface EventCardProps {
  event: Serialized<ChurchEvent>;
}

export function EventCard({ event }: EventCardProps) {
  const startDate = event.startDateTime ? new Date(event.startDateTime) : null;
  const endDate = event.endDateTime ? new Date(event.endDateTime) : null;

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
      className="group flex flex-col bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.imageAlt || event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300">
            <Calendar className="w-12 h-12" />
          </div>
        )}
        {/* Date Badge */}
        {startDate && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-sm flex flex-col items-center justify-center w-14 h-16 text-center border border-stone-100/50">
            <span className="text-xs font-bold text-primary leading-none uppercase">{formattedMonth}</span>
            <span className="text-xl font-bold text-stone-900 leading-none mt-1">{formattedDay}</span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold font-serif text-stone-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>
        
        <div className="mt-auto space-y-2 text-sm text-stone-600">
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
      </div>
    </Link>
  );
}
