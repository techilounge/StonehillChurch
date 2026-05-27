"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, CheckSquare, Loader2, Trash2, X } from "lucide-react";
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

type MediaUsage = {
  area: string;
  collection: string;
  docId: string;
  label: string;
};

type UsageResponse =
  | { ok: true; data: { usages: Record<string, MediaUsage[]> } }
  | { ok: false; error: { message: string } };

type PendingDelete =
  | { kind: "single"; id: string; name: string; usages: MediaUsage[] | null }
  | {
      kind: "bulk";
      ids: string[];
      nameById: Record<string, string>;
      usages: Record<string, MediaUsage[]> | null;
    };

export interface MediaManagerProps {
  onSelectAsset?: (url: string) => void;
}

export function MediaManager({ onSelectAsset }: MediaManagerProps) {
  const [assets, setAssets] = React.useState<Serialized<MediaAsset>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = React.useState<PendingDelete | null>(null);
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

  const fetchUsages = React.useCallback(
    async (ids: string[]): Promise<Record<string, MediaUsage[]>> => {
      const response = await fetch("/api/admin/media/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = (await response.json()) as UsageResponse;
      if (!response.ok || !data.ok) {
        throw new Error(!data.ok ? data.error.message : "Usage check failed.");
      }
      return data.data.usages;
    },
    [],
  );

  const requestSingleDelete = React.useCallback(
    (id: string) => {
      const asset = assets.find((a) => a.id === id);
      const name = asset?.originalFileName ?? "this item";
      setPendingDelete({ kind: "single", id, name, usages: null });
      fetchUsages([id])
        .then((map) => {
          setPendingDelete((prev) =>
            prev && prev.kind === "single" && prev.id === id
              ? { ...prev, usages: map[id] ?? [] }
              : prev,
          );
        })
        .catch((err) => {
          console.error("Usage check failed:", err);
          setPendingDelete((prev) =>
            prev && prev.kind === "single" && prev.id === id ? { ...prev, usages: [] } : prev,
          );
        });
    },
    [assets, fetchUsages],
  );

  const requestBulkDelete = React.useCallback(() => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const nameById: Record<string, string> = {};
    for (const id of ids) {
      const asset = assets.find((a) => a.id === id);
      nameById[id] = asset?.originalFileName ?? id;
    }
    setPendingDelete({ kind: "bulk", ids, nameById, usages: null });
    fetchUsages(ids)
      .then((map) => {
        setPendingDelete((prev) =>
          prev && prev.kind === "bulk" ? { ...prev, usages: map } : prev,
        );
      })
      .catch((err) => {
        console.error("Usage check failed:", err);
        setPendingDelete((prev) =>
          prev && prev.kind === "bulk" ? { ...prev, usages: {} } : prev,
        );
      });
  }, [selectedIds, assets, fetchUsages]);

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

  const dialogInfo = React.useMemo(() => {
    if (!pendingDelete) {
      return { title: "", body: null as React.ReactNode, inUse: false };
    }

    if (pendingDelete.kind === "single") {
      const usages = pendingDelete.usages;
      if (usages === null) {
        return {
          title: "Delete this media asset?",
          inUse: false,
          body: (
            <div className="flex items-center gap-2 text-slate-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking where this file is used...</span>
            </div>
          ),
        };
      }
      if (usages.length === 0) {
        return {
          title: "Delete this media asset?",
          inUse: false,
          body: (
            <p>
              <strong className="text-slate-900">{pendingDelete.name}</strong> will be permanently
              removed from storage. This action cannot be undone.
            </p>
          ),
        };
      }
      return {
        title: "This media is currently in use",
        inUse: true,
        body: (
          <div className="space-y-3">
            <p>
              <strong className="text-slate-900">{pendingDelete.name}</strong> is referenced in{" "}
              {usages.length} place{usages.length === 1 ? "" : "s"}. Deleting it will leave broken
              images.
            </p>
            <UsageList usages={usages} />
            <p className="text-slate-700">Do you still want to proceed?</p>
          </div>
        ),
      };
    }

    const usages = pendingDelete.usages;
    if (usages === null) {
      return {
        title: `Delete ${pendingDelete.ids.length} media assets?`,
        inUse: false,
        body: (
          <div className="flex items-center gap-2 text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking where these files are used...</span>
          </div>
        ),
      };
    }
    const usedEntries = pendingDelete.ids
      .map((id) => ({ id, name: pendingDelete.nameById[id], list: usages[id] ?? [] }))
      .filter((e) => e.list.length > 0);

    if (usedEntries.length === 0) {
      return {
        title: `Delete ${pendingDelete.ids.length} media assets?`,
        inUse: false,
        body: (
          <p>
            This will permanently remove {pendingDelete.ids.length} files from storage. This action
            cannot be undone.
          </p>
        ),
      };
    }

    return {
      title: `${usedEntries.length} of ${pendingDelete.ids.length} are in use`,
      inUse: true,
      body: (
        <div className="space-y-3">
          <p>
            The following file{usedEntries.length === 1 ? " is" : "s are"} referenced elsewhere in
            the app. Deleting will leave broken images.
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {usedEntries.map((entry) => (
              <div key={entry.id} className="border border-slate-200 rounded-md p-2">
                <p className="font-medium text-slate-900 truncate" title={entry.name}>
                  {entry.name}
                </p>
                <UsageList usages={entry.list} />
              </div>
            ))}
          </div>
          <p className="text-slate-700">Do you still want to proceed?</p>
        </div>
      ),
    };
  }, [pendingDelete]);

  const checkingUsage =
    pendingDelete !== null &&
    (pendingDelete.kind === "single"
      ? pendingDelete.usages === null
      : pendingDelete.usages === null);

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
              <Button variant="outline" size="sm" onClick={() => setSelectionMode(true)}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Select
              </Button>
            )}
            {!isSelectorMode && selectionMode && (
              <>
                <span className="text-sm text-slate-700">{selectedIds.size} selected</span>
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
        title={dialogInfo.title}
        description={
          <div className="space-y-2">
            {dialogInfo.inUse && (
              <div className="flex items-center gap-2 text-amber-700 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Warning: this file is in active use</span>
              </div>
            )}
            {dialogInfo.body}
          </div>
        }
        confirmLabel={
          deleting
            ? "Deleting..."
            : checkingUsage
              ? "Checking..."
              : dialogInfo.inUse
                ? "Delete anyway"
                : "Delete"
        }
        confirmDisabled={deleting || checkingUsage}
        destructive
      />
    </div>
  );
}

function UsageList({ usages }: { usages: MediaUsage[] }) {
  return (
    <ul className="text-sm text-slate-700 list-disc pl-5 space-y-0.5">
      {usages.map((u, i) => (
        <li key={`${u.collection}-${u.docId}-${i}`}>
          <span className="text-slate-500">{u.area}:</span>{" "}
          <span className="text-slate-900">{u.label}</span>
        </li>
      ))}
    </ul>
  );
}
