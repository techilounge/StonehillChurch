"use client";

import * as React from "react";
import Image from "next/image";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/shared/Button";
import type { Serialized } from "@/lib/data/utils";
import type { MediaAsset } from "@/types/media";

interface MediaGridProps {
  assets: Serialized<MediaAsset>[];
  onSelectAsset?: (url: string) => void;
}

export function MediaGrid({ assets, onSelectAsset }: MediaGridProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopyUrl = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  if (assets.length === 0) {
    return (
      <div className="rounded-xl border border-stonehill-line bg-white p-12 text-center shadow-sm">
        <h3 className="text-lg font-medium text-stonehill-ink mb-2">No media found</h3>
        <p className="text-stonehill-ink/60">Upload some images to see them here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {assets.map((asset) => (
        <div key={asset.id} className="group flex flex-col overflow-hidden rounded-xl border border-stonehill-line bg-white shadow-sm hover:shadow-md hover:border-stonehill-gold/30 motion-safe:transition-all">
          <div className="relative aspect-video bg-stonehill-cream/30 overflow-hidden">
            <Image
              src={asset.url}
              alt={asset.altText}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-stonehill-ink/60 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity flex items-center justify-center gap-3">
              {onSelectAsset ? (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => onSelectAsset(asset.url)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Select Image
                </Button>
              ) : (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/90 border-transparent hover:bg-white text-stonehill-ink"
                    onClick={() => handleCopyUrl(asset.id, asset.url)}
                  >
                    {copiedId === asset.id ? (
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy URL
                  </Button>
                  <a 
                    href={asset.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 bg-white/90 rounded-md hover:bg-white text-stonehill-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-gold"
                    aria-label="Open in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </>
              )}
            </div>
          </div>
          
          <div className="p-4 flex flex-col flex-1">
            <h4 className="text-sm font-medium text-stonehill-ink truncate mb-1" title={asset.originalFileName}>
              {asset.originalFileName}
            </h4>
            <div className="flex items-center justify-between mt-auto pt-2">
              <span className="text-xs text-stonehill-ink/60">
                {(asset.size / 1024).toFixed(1)} KB
              </span>
              <span className="text-xs text-stonehill-ink/60 bg-stonehill-cream px-2 py-0.5 rounded-full uppercase font-medium">
                {asset.contentType.replace('image/', '')}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
