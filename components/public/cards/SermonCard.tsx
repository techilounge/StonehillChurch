import React from "react";
import Image from "next/image";
import Link from "next/link";
import { PlayCircle, Calendar } from "lucide-react";
import { type z } from "zod";
import { sermonSchema } from "@/lib/validators";
import { Card, CardContent } from "@/components/shared/Card";
import { formatDate } from "@/lib/utils";

type Sermon = z.infer<typeof sermonSchema>;

interface SermonCardProps {
  sermon: Sermon;
}

export function SermonCard({ sermon }: SermonCardProps) {
  return (
    <Card className="group overflow-hidden flex flex-col h-full transition-shadow hover:shadow-lg focus-within:ring-2 focus-within:ring-stonehill-gold focus-within:ring-offset-2">
      <div className="relative aspect-video w-full bg-stonehill-muted overflow-hidden">
        <Image
          src={sermon.thumbnailUrl}
          alt={sermon.thumbnailAlt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayCircle className="w-16 h-16 text-white opacity-90" />
        </div>
      </div>
      <CardContent className="flex-1 flex flex-col p-6">
        <div className="flex items-center text-sm text-stonehill-muted mb-3 space-x-2">
          <Calendar className="w-4 h-4" />
          <time dateTime={new Date(sermon.sermonDate).toISOString()}>
            {formatDate(sermon.sermonDate as Date | string)}
          </time>
        </div>
        <h3 className="text-xl font-bold text-stonehill-ink mb-2 line-clamp-2">
          <Link href={`/sermons/${sermon.slug}`} className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {sermon.title}
          </Link>
        </h3>
        <p className="text-stonehill-muted mb-4 line-clamp-3 flex-1">
          {sermon.description}
        </p>
        <div className="text-sm font-medium text-stonehill-evergreen mt-auto">
          {sermon.speaker} {sermon.series && <span className="opacity-75 font-normal ml-1">• {sermon.series}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
