"use client";

import * as React from "react";
import { MediaUploadPanel } from "./MediaUploadPanel";
import { MediaGrid } from "./MediaGrid";
import type { Serialized } from "@/lib/data/utils";
import type { MediaAsset } from "@/types/media";
import { AlertCircle } from "lucide-react";

type ListResponse = 
  | { ok: true; data: { assets: Serialized<MediaAsset>[] } }
  | { ok: false; error: { message: string } };

export interface MediaManagerProps {
  onSelectAsset?: (url: string) => void;
}

export function MediaManager({ onSelectAsset }: MediaManagerProps) {
  const [assets, setAssets] = React.useState<Serialized<MediaAsset>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAssets = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/media?limit=50");
      const data = (await response.json()) as ListResponse;

      if (!response.ok || !data.ok) {
        throw new Error(!data.ok ? data.error.message : "Failed to load media assets");
      }

      setAssets(data.data.assets);
    } catch (err: any) {
      console.error("Failed to load assets:", err);
      setError(err.message || "Network error. Could not load media assets.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <MediaUploadPanel onUploadSuccess={fetchAssets} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-stonehill-ink">Media Library</h2>
          {loading && <span className="text-sm text-stonehill-muted">Refreshing...</span>}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading && assets.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-stonehill-line bg-white shadow-sm">
                <div className="aspect-video bg-stonehill-line" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-4 w-3/4 bg-stonehill-line rounded" />
                  <div className="h-3 w-1/4 bg-stonehill-line rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <MediaGrid assets={assets} onSelectAsset={onSelectAsset} />
        )}
      </section>
    </div>
  );
}
