import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Clock } from "lucide-react";
import { type z } from "zod";
import { eventSchema } from "@/lib/validators";
import { Card, CardContent } from "@/components/shared/Card";
import { Badge } from "@/components/shared/Badge";

type Event = z.infer<typeof eventSchema>;

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const startDate = new Date(event.startDateTime as string | Date);
  const month = startDate.toLocaleString("default", { month: "short" });
  const day = startDate.getDate();
  const time = startDate.toLocaleTimeString("default", { hour: "numeric", minute: "2-digit" });

  return (
    <Card className="group overflow-hidden flex flex-col h-full transition-shadow hover:shadow-lg focus-within:ring-2 focus-within:ring-stonehill-gold focus-within:ring-offset-2">
      <div className="relative h-48 w-full bg-stonehill-muted overflow-hidden">
        <Image
          src={event.imageUrl}
          alt={event.imageAlt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg px-3 py-2 text-center shadow-sm">
          <div className="text-xs font-bold uppercase text-stonehill-leaf tracking-wider">{month}</div>
          <div className="text-xl font-bold text-stonehill-ink leading-none mt-0.5">{day}</div>
        </div>
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="capitalize shadow-sm">
            {event.category}
          </Badge>
        </div>
      </div>
      <CardContent className="flex-1 flex flex-col p-6">
        <h3 className="text-xl font-bold text-stonehill-ink mb-3 line-clamp-2">
          <Link href={`/events/${event.slug}`} className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {event.title}
          </Link>
        </h3>
        
        <div className="space-y-2 mt-auto text-sm text-stonehill-muted">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{time}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{event.location}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
