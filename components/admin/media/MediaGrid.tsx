"use client";

import * as React from "react";
import Image from "next/image";
import { Copy, Check, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/shared/Button";
import type { Serialized } from "@/lib/data/utils";
import type { MediaAsset } from "@/types/media";

interface MediaGridProps {
  assets: Serialized<MediaAsset>[];
  onSelectAsset?: (url: string) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelected?: (id: string) => void;
  onRequestDelete?: (id: string) => void;
}

export function MediaGrid({
  assets,
  onSelectAsset,
  selectionMode = false,
  selectedIds,
  onToggleSelected,
  onRequestDelete,
}: MediaGridProps) {
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
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <h3 className="text-lg font-medium text-slate-900 mb-2">No media found</h3>
        <p className="text-slate-900/60">Upload some images to see them here.</p>
      </div>
    );
  }

  const isSelectorMode = !!onSelectAsset;
  const isBulkMode = selectionMode && !isSelectorMode;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {assets.map((asset) => {
        const selected = selectedIds?.has(asset.id) ?? false;
        return (
          <div
            key={asset.id}
            className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm motion-safe:transition-all ${
              selected
                ? "border-stonehill-accent ring-2 ring-stonehill-accent/40"
                : "border-slate-200 hover:shadow-md hover:border-stonehill-accent/30"
            }`}
          >
            <div
              className={`relative aspect-video bg-slate-50/30 overflow-hidden ${
                isBulkMode ? "cursor-pointer" : ""
              }`}
              onClick={
                isBulkMode && onToggleSelected
                  ? () => onToggleSelected(asset.id)
                  : undefined
              }
            >
              <Image
                src={asset.url}
                alt={asset.altText}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />

              {isBulkMode && (
                <div className="absolute top-2 left-2 z-10">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-md border-2 shadow-sm ${
                      selected
                        ? "bg-stonehill-accent border-stonehill-accent text-white"
                        : "bg-white/90 border-slate-300"
                    }`}
                    aria-hidden="true"
                  >
                    {selected && <Check className="h-4 w-4" />}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selected}
                    onChange={() => onToggleSelected?.(asset.id)}
                    aria-label={`Select ${asset.originalFileName}`}
                  />
                </div>
              )}

              {!isBulkMode && (
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity flex items-center justify-center gap-3">
                  {isSelectorMode ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onSelectAsset?.(asset.url)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Select Image
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/90 border-transparent hover:bg-white text-slate-900"
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
                        className="p-2 bg-white/90 rounded-md hover:bg-white text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent"
                        aria-label="Open in new tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {onRequestDelete && (
                        <button
                          type="button"
                          onClick={() => onRequestDelete(asset.id)}
                          className="p-2 bg-white/90 rounded-md hover:bg-red-50 text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          aria-label={`Delete ${asset.originalFileName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h4
                className="text-sm font-medium text-slate-900 truncate mb-1"
                title={asset.originalFileName}
              >
                {asset.originalFileName}
              </h4>
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="text-xs text-slate-900/60">
                  {(asset.size / 1024).toFixed(1)} KB
                </span>
                <span className="text-xs text-slate-900/60 bg-slate-50 px-2 py-0.5 rounded-full uppercase font-medium">
                  {asset.contentType.replace("image/", "")}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
