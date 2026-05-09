import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Serialized } from "@/lib/data/utils";
import { Sermon } from "@/types/content";
import { PlayCircle, Calendar, User } from "lucide-react";

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
      className="group flex flex-col bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      <div className="relative aspect-video w-full bg-stone-100 overflow-hidden">
        {sermon.thumbnailUrl ? (
          <Image
            src={sermon.thumbnailUrl}
            alt={sermon.thumbnailAlt || sermon.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-300">
            <PlayCircle className="w-16 h-16" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
        <div className="absolute bottom-3 right-3 bg-black/70 text-white rounded-full p-2 backdrop-blur-sm">
          <PlayCircle className="w-5 h-5" />
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        {sermon.series && (
          <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            {sermon.series}
          </span>
        )}
        <h3 className="text-xl font-bold font-serif text-stone-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {sermon.title}
        </h3>
        
        <div className="mt-auto space-y-2 text-sm text-stone-600">
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
      </div>
    </Link>
  );
}
