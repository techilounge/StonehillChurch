"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from "@/lib/youtube";

type YouTubeLiteEmbedProps = {
  videoId: string;
  title: string;
  thumbnailUrl?: string | null;
  className?: string;
  buttonLabel?: string;
};

export function YouTubeLiteEmbed({
  videoId,
  title,
  thumbnailUrl,
  className,
  buttonLabel,
}: YouTubeLiteEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const fallbackThumbnail = getYouTubeThumbnailUrl(videoId);
  const primaryThumbnail = thumbnailUrl || fallbackThumbnail;
  const [thumbnailState, setThumbnailState] = useState<{
    src: string;
    stage: "primary" | "fallback" | "hidden";
  }>({ src: primaryThumbnail, stage: "primary" });

  const currentStage =
    thumbnailState.src === primaryThumbnail ? thumbnailState.stage : "primary";
  const displayedThumbnail =
    currentStage === "primary" ? primaryThumbnail : fallbackThumbnail;

  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-lg bg-slate-900", className)}>
      {isPlaying ? (
        <iframe
          src={getYouTubeEmbedUrl(videoId)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      ) : (
        <>
          {currentStage !== "hidden" && (
            <img
              src={displayedThumbnail}
              alt=""
              aria-hidden="true"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => {
                if (currentStage === "primary" && primaryThumbnail !== fallbackThumbnail) {
                  setThumbnailState({ src: primaryThumbnail, stage: "fallback" });
                } else {
                  setThumbnailState({ src: primaryThumbnail, stage: "hidden" });
                }
              }}
              className="h-full w-full object-cover opacity-90"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <button
            type="button"
            aria-label={buttonLabel ?? `Play ${title}`}
            onClick={() => setIsPlaying(true)}
            className="group absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-lg motion-safe:transition motion-safe:group-hover:scale-105 group-hover:bg-white sm:h-20 sm:w-20">
              <PlayCircle className="h-9 w-9 sm:h-11 sm:w-11" aria-hidden="true" />
            </span>
          </button>
        </>
      )}
    </div>
  );
}
