import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Serialized } from "@/lib/data/utils";
import { Sermon } from "@/types/content";
import { PlayCircle, Calendar, User } from "lucide-react";
import { Card, CardContent } from "@/components/shared/Card";

interface SermonCardProps {
  sermon: Serialized<Sermon>;
}

export function SermonCard({ sermon }: SermonCardProps) {
  const formattedDate = sermon.sermonDate
    ? new Date(sermon.sermonDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <Link
      href={`/sermons/${sermon.slug}`}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
    >
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-300">
        <div className="relative aspect-video w-full bg-slate-50 overflow-hidden">
          {sermon.thumbnailUrl ? (
            <Image
              src={sermon.thumbnailUrl}
              alt={sermon.thumbnailAlt || sermon.title}
              fill
              className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500/50">
              <PlayCircle className="w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
          <div className="absolute bottom-3 right-3 bg-black/70 text-white rounded-full p-2 backdrop-blur-sm">
            <PlayCircle className="w-5 h-5" />
          </div>
        </div>

        <CardContent className="p-5 flex flex-col flex-grow">
          {sermon.series && (
            <span className="text-xs font-semibold text-stonehill-primary uppercase tracking-wider mb-2">
              {sermon.series}
            </span>
          )}
          <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3 line-clamp-2 group-hover:text-stonehill-primary transition-colors">
            {sermon.title}
          </h3>
          
          <div className="mt-auto space-y-2 text-sm text-slate-500">
            {sermon.speaker && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{sermon.speaker}</span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
