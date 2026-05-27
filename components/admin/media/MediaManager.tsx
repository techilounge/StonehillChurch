"use client";

import * as React from "react";
import { AlertCircle, CheckSquare, Trash2, X } from "lucide-react";
import { MediaUploadPanel } from "./MediaUploadPanel";
import { MediaGrid } from "./MediaGrid";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { Button } from "@/components/shared/Button";
import type { Serialized } from "@/lib/data/utils";
import type { MediaAsset } from "@/types/media";

type ListResponse =
  | { ok: true; data: { assets: Serialized<MediaAsset>[] } }
  | { ok: false; error: { message: string } };

type DeleteResponse =
  | { ok: true; data: { deletedCount: number; failed: { id: string; reason: string }[] } }
  | { ok: false; error: { message: string } };

export interface MediaManagerProps {
  onSelectAsset?: (url: string) => void;
}

export function MediaManager({ onSelectAsset }: MediaManagerProps) {
  const [assets, setAssets] = React.useState<Serialized<MediaAsset>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = React.useState<
    | { kind: "single"; id: string; name: string }
    | { kind: "bulk"; ids: string[] }
    | null
  >(null);
  const [deleting, setDeleting] = React.useState(false);

  const isSelectorMode = !!onSelectAsset;

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

  const toggleSelected = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const exitSelectionMode = React.useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const selectAll = React.useCallback(() => {
    setSelectedIds(new Set(assets.map((a) => a.id)));
  }, [assets]);

  const requestSingleDelete = React.useCallback(
    (id: string) => {
      const asset = assets.find((a) => a.id === id);
      setPendingDelete({
        kind: "single",
        id,
        name: asset?.originalFileName ?? "this item",
      });
    },
    [assets],
  );

  const requestBulkDelete = React.useCallback(() => {
    if (selectedIds.size === 0) return;
    setPendingDelete({ kind: "bulk", ids: Array.from(selectedIds) });
  }, [selectedIds]);

  const confirmDelete = React.useCallback(async () => {
    if (!pendingDelete) return;

    const ids = pendingDelete.kind === "single" ? [pendingDelete.id] : pendingDelete.ids;
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = (await response.json()) as DeleteResponse;

      if (!response.ok || !data.ok) {
        throw new Error(!data.ok ? data.error.message : "Failed to delete media.");
      }

      const { deletedCount, failed } = data.data;
      setAssets((prev) =>
        prev.filter((a) => !(ids.includes(a.id) && !failed.some((f) => f.id === a.id))),
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => {
          if (!failed.some((f) => f.id === id)) next.delete(id);
        });
        return next;
      });

      if (failed.length > 0) {
        setError(
          `${deletedCount} deleted, ${failed.length} failed: ${failed
            .map((f) => f.reason)
            .join("; ")}`,
        );
      } else if (pendingDelete.kind === "bulk") {
        exitSelectionMode();
      }
    } catch (err: any) {
      console.error("Delete failed:", err);
      setError(err.message || "Network error. Could not delete media.");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }, [pendingDelete, exitSelectionMode]);

  return (
    <div className="flex flex-col gap-8">
      <section>
        <MediaUploadPanel onUploadSuccess={fetchAssets} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Media Library</h2>
          <div className="flex items-center gap-2">
            {loading && <span className="text-sm text-slate-500">Refreshing...</span>}
            {!isSelectorMode && assets.length > 0 && !selectionMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectionMode(true)}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Select
              </Button>
            )}
            {!isSelectorMode && selectionMode && (
              <>
                <span className="text-sm text-slate-700">
                  {selectedIds.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAll}
                  disabled={selectedIds.size === assets.length}
                >
                  Select all
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={requestBulkDelete}
                  disabled={selectedIds.size === 0 || deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
                </Button>
                <Button variant="outline" size="sm" onClick={exitSelectionMode}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
          </div>
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
              <div
                key={i}
                className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-video bg-slate-200" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  <div className="h-3 w-1/4 bg-slate-200 rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <MediaGrid
            assets={assets}
            onSelectAsset={onSelectAsset}
            selectionMode={!isSelectorMode && selectionMode}
            selectedIds={selectedIds}
            onToggleSelected={toggleSelected}
            onRequestDelete={!isSelectorMode ? requestSingleDelete : undefined}
          />
        )}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
        onConfirm={confirmDelete}
        title={
          pendingDelete?.kind === "bulk"
            ? `Delete ${pendingDelete.ids.length} media assets?`
            : "Delete this media asset?"
        }
        description={
          pendingDelete?.kind === "bulk"
            ? `This will permanently remove ${pendingDelete.ids.length} files from storage. This action cannot be undone.`
            : pendingDelete?.kind === "single"
              ? `"${pendingDelete.name}" will be permanently removed from storage. This action cannot be undone.`
              : ""
        }
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        destructive
      />
    </div>
  );
}
