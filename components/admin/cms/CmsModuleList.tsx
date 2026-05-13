"use client";

import * as React from "react";
import { useId } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Archive, Trash2, Globe } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import toast from "react-hot-toast";
import { Button } from "@/components/shared/Button";
import { TextInput } from "@/components/forms/TextInput";
import { CMS_CONFIG } from "./CmsConfig";
import { SortableSlideRow } from "./SortableSlideRow";
import type { CmsModule, CmsDocument } from "@/lib/data/adminCms";
import {
  archiveDocumentAction,
  deleteDocumentAction,
  publishDocumentAction,
  reorderDocumentsAction,
} from "@/app/admin/cms/actions";
import { PUBLISHED } from "@/types/shared";

interface CmsModuleListProps {
  module: Exclude<CmsModule, "siteSettings">;
  data: CmsDocument[];
  canCreate: boolean;
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
}

export function CmsModuleList({
  module,
  data,
  canCreate,
  canEdit,
  canPublish,
  canDelete,
}: CmsModuleListProps) {
  const config = CMS_CONFIG[module];
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isMutating, setIsMutating] = React.useState(false);

  /* ─── Sortable state ──────────────────────────────────────────── */
  const isSortable = module === "homepageSlides";
  const [items, setItems] = React.useState<CmsDocument[]>(data);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const dndContextId = useId();

  // Sync local state when server data changes (e.g. after revalidation)
  React.useEffect(() => {
    setItems(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = React.useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      // Optimistic reorder
      const oldItems = [...items];
      const oldIndex = items.findIndex((item) => item.id === String(active.id));
      const newIndex = items.findIndex((item) => item.id === String(over.id));

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...items];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      setItems(reordered);

      // Persist to backend
      setIsSaving(true);
      const orderedIds = reordered.map((item) => item.id);
      const result = await reorderDocumentsAction(module, orderedIds);

      if (!result.ok) {
        // Revert on failure
        setItems(oldItems);
        toast.error("Unable to save slide order. Please try again.");
      } else {
        toast.success("Slide order saved");
      }
      setIsSaving(false);
    },
    [items, module]
  );

  /* ─── Filtering ───────────────────────────────────────────────── */
  const filteredData = React.useMemo(() => {
    const source = isSortable ? items : data;
    if (!searchQuery.trim()) return source;
    const query = searchQuery.toLowerCase();
    return source.filter((doc) => {
      return config.fields
        .filter((f) => f.type === "text" || f.type === "textarea" || f.type === "slug")
        .some((f) => {
          const val = doc[f.name];
          return typeof val === "string" && val.toLowerCase().includes(query);
        });
    });
  }, [data, items, searchQuery, config.fields, isSortable]);

  const handleAction = async (
    action: "publish" | "archive" | "delete",
    id: string,
    confirmMessage?: string
  ) => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setIsMutating(true);
    try {
      let result;
      if (action === "publish") {
        result = await publishDocumentAction(module, id);
      } else if (action === "archive") {
        result = await archiveDocumentAction(module, id);
      } else if (action === "delete") {
        result = await deleteDocumentAction(module, id, true);
      }

      if (result && !result.ok) {
        alert(result.error.message);
      }
    } catch (e) {
      alert("An unexpected error occurred.");
    } finally {
      setIsMutating(false);
    }
  };

  // Determine primary display column
  const primaryField = config.fields.find((f) => f.name === "title" || f.name === "name") || config.fields[0];

  const routePath = module.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

  /* ─── Table row renderer ──────────────────────────────────────── */
  const renderRowCells = (doc: CmsDocument) => {
    const status = (doc.status as string) || (doc.active ? "active" : "inactive");
    const primaryValue = String(doc[primaryField.name] || "(Untitled)");
    const dateVal = doc.updatedAt || doc.createdAt;
    const dateStr = dateVal ? new Date(dateVal as string).toLocaleDateString() : "Unknown";

    return (
      <>
        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-stonehill-ink">
          {primaryValue}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
            status === PUBLISHED || status === "active" ? "bg-green-100 text-green-800" :
            status === "draft" ? "bg-yellow-100 text-yellow-800" :
            status === "archived" || status === "inactive" ? "bg-gray-100 text-gray-800" :
            "bg-blue-100 text-blue-800"
          }`}>
            {status}
          </span>
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-sm text-stonehill-ink/70">
          {dateStr}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
          <div className="flex items-center justify-end gap-2">
            {canEdit && (
              <Link href={`/admin/${routePath}/${doc.id}`}>
                <Button variant="outline" size="sm" className="h-8 px-2" disabled={isMutating}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
              </Link>
            )}
            {canPublish && status === "draft" && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 text-stonehill-evergreen hover:text-stonehill-evergreen hover:border-stonehill-evergreen"
                disabled={isMutating}
                onClick={() => handleAction("publish", doc.id)}
                title="Publish"
              >
                <Globe className="h-4 w-4" />
              </Button>
            )}
            {canDelete && status !== "archived" && status !== "inactive" && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2"
                disabled={isMutating}
                onClick={() => handleAction("archive", doc.id, `Are you sure you want to archive this ${config.singular.toLowerCase()}?`)}
                title="Archive"
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
            {canDelete && (status === "archived" || status === "inactive") && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 text-red-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50"
                disabled={isMutating}
                onClick={() => handleAction("delete", doc.id, `Are you sure you want to permanently delete this ${config.singular.toLowerCase()}? This cannot be undone.`)}
                title="Delete Permanently"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </td>
      </>
    );
  };

  /* ─── Render ──────────────────────────────────────────────────── */
  const isSearching = !!searchQuery.trim();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-stonehill-ink">{config.title}</h1>
        {canCreate && (
          <Link href={`/admin/${routePath}/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New {config.singular}
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stonehill-ink/50" />
          <TextInput
            placeholder={`Search ${config.title.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Reorder hint */}
        {isSortable && !isSearching && (
          <div className="flex items-center gap-2 text-xs text-stonehill-ink/50">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-stonehill-gold" />
            Drag the handle to reorder slides. Changes save automatically.
            {isSaving && (
              <span className="ml-2 inline-flex items-center gap-1 text-stonehill-gold animate-pulse">
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </span>
            )}
          </div>
        )}

        {/* DndContext must be OUTSIDE the table to avoid its hidden
           accessibility <div> being placed inside <tbody> (invalid HTML).
           SortableContext is a pure context provider with no DOM output,
           so it's safe inside <tbody>. */}
        {isSortable && !isSearching ? (
          <DndContext
            id={dndContextId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <div className="overflow-x-auto rounded-lg border border-stonehill-line bg-white shadow-sm">
              <table className="min-w-full divide-y divide-stonehill-line">
                <thead className="bg-stonehill-cream/40">
                  <tr>
                    <th scope="col" className="w-10 pl-3 pr-0 py-3">
                      <span className="sr-only">Reorder</span>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stonehill-ink/70">
                      {primaryField.label}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stonehill-ink/70">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stonehill-ink/70">
                      Last Updated
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stonehill-line bg-white">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-stonehill-muted">
                        No {config.title.toLowerCase()} found.
                      </td>
                    </tr>
                  ) : (
                    <SortableContext
                      items={filteredData.map((d) => d.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {filteredData.map((doc) => (
                        <SortableSlideRow
                          key={doc.id}
                          id={doc.id}
                          disabled={isSaving || isMutating}
                        >
                          {renderRowCells(doc)}
                        </SortableSlideRow>
                      ))}
                    </SortableContext>
                  )}
                </tbody>
              </table>
            </div>
          </DndContext>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stonehill-line bg-white shadow-sm">
            <table className="min-w-full divide-y divide-stonehill-line">
              <thead className="bg-stonehill-cream/40">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stonehill-ink/70">
                    {primaryField.label}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stonehill-ink/70">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stonehill-ink/70">
                    Last Updated
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stonehill-line bg-white">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-stonehill-muted">
                      No {config.title.toLowerCase()} found.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((doc) => (
                    <tr key={doc.id} className="hover:bg-stonehill-cream/10 transition-colors">
                      {renderRowCells(doc)}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
