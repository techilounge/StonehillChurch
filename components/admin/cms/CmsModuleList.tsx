"use client";

import * as React from "react";
import { useId } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Archive, Trash2, Globe, Heart } from "lucide-react";
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
  updateDocumentAction,
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
  const [confirmDialog, setConfirmDialog] = React.useState<{isOpen: boolean, id: string, name: string, isFeatured: boolean} | null>(null);

  /* ─── Sortable state ──────────────────────────────────────────── */
  const isSortable = module === "homepageSlides" || module === "ministries" || module === "leaders" || module === "leaderCategories";
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

      const moduleName = module === "homepageSlides" ? "slide" : "ministry";
      if (!result.ok) {
        // Revert on failure
        setItems(oldItems);
        toast.error(`Unable to save ${moduleName} order. Please try again.`);
      } else {
        toast.success(`${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} order saved`);
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

  const handleToggleFeatured = async (id: string, currentlyFeatured: boolean) => {
    setIsMutating(true);
    try {
      const result = await updateDocumentAction(module, id, { featured: !currentlyFeatured });
      if (!result.ok) {
        let errorMessage = result.error.message;
        if (result.error.fieldErrors) {
          const missingFields = Object.keys(result.error.fieldErrors).join(", ");
          errorMessage += ` Missing or invalid fields: ${missingFields}. Please edit the document to fix them.`;
        }
        toast.error(errorMessage, { duration: 6000 });
      } else {
        toast.success(`Successfully ${currentlyFeatured ? "removed from" : "added to"} featured items.`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsMutating(false);
      setConfirmDialog(null);
    }
  };

  // Determine primary display column
  const primaryField = config.fields.find((f) => f.name === "title" || f.name === "name") || config.fields[0];
  const hasFeaturedField = config.fields.some((f) => f.name === "featured");
  const routePath = module.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

  /* ─── Table row renderer ──────────────────────────────────────── */
  const renderRowCells = (doc: CmsDocument) => {
    const status = (doc.status as string) || (doc.active ? "active" : "inactive");
    const primaryValue = String(doc[primaryField.name] || "(Untitled)");
    const dateVal = doc.updatedAt || doc.createdAt;
    const dateStr = dateVal ? new Date(dateVal as string).toLocaleDateString() : "Unknown";
    const isFeatured = !!doc.featured;

    return (
      <>
        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
          <div className="flex items-center gap-2">
            {primaryValue}
            {hasFeaturedField && isFeatured && (
              <Heart className="h-3 w-3 fill-stonehill-accent text-stonehill-accent" />
            )}
          </div>
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
        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-900/70">
          {dateStr}
        </td>
        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
          <div className="flex items-center justify-end gap-2">
            {hasFeaturedField && canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                className={`h-8 px-2 transition-colors ${isFeatured ? "text-stonehill-accent border-stonehill-accent bg-stonehill-accent/10" : "text-slate-400 hover:text-stonehill-accent"}`}
                disabled={isMutating}
                onClick={() => setConfirmDialog({ isOpen: true, id: doc.id, name: primaryValue, isFeatured })}
                title={isFeatured ? "Remove from Featured" : "Mark as Featured"}
              >
                <Heart className={`h-4 w-4 ${isFeatured ? "fill-stonehill-accent" : ""}`} />
              </Button>
            )}
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
                className="h-8 px-2 text-stonehill-primary hover:text-stonehill-primary hover:border-stonehill-primary"
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
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">{config.title}</h1>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-900/50" />
            <TextInput
              placeholder={`Search ${config.title.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Reorder hint */}
          {isSortable && !isSearching && (
            <div className="flex items-center gap-2 text-xs text-slate-900/50">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-stonehill-accent" />
              Drag the handle to reorder {module === "homepageSlides" ? "slides" : module === "leaders" ? "leaders" : module === "leaderCategories" ? "categories" : "ministries"}. Changes save automatically.
              {isSaving && (
                <span className="ml-2 inline-flex items-center gap-1 text-stonehill-accent animate-pulse">
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
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/40">
                    <tr>
                      <th scope="col" className="w-10 pl-3 pr-0 py-3">
                        <span className="sr-only">Reorder</span>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">
                        {primaryField.label}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">
                        Last Updated
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
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
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50/40">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">
                      {primaryField.label}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">
                      Last Updated
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                        No {config.title.toLowerCase()} found.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/10 transition-colors">
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

      {/* Premium Confirmation Dialog for Featuring Items */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isMutating && setConfirmDialog(null)}
          />
          
          {/* Dialog Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-12 h-12 rounded-full mb-6 mx-auto bg-stonehill-accent/10">
              <Heart className={`h-6 w-6 ${confirmDialog.isFeatured ? "text-slate-400" : "text-stonehill-accent fill-stonehill-accent"}`} />
            </div>
            
            <h3 className="text-2xl text-center font-display font-bold text-stonehill-dark mb-3">
              {confirmDialog.isFeatured ? "Remove from Featured?" : "Add to Featured?"}
            </h3>
            
            <p className="text-slate-600 text-center mb-8 leading-relaxed">
              {confirmDialog.isFeatured
                ? `Are you sure you want to remove "${confirmDialog.name}" from the featured list? It will no longer appear on the homepage.`
                : `Are you sure you want to feature "${confirmDialog.name}"? It will be highlighted on the homepage.`}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={() => setConfirmDialog(null)} 
                disabled={isMutating}
                className="w-full sm:w-1/2"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => handleToggleFeatured(confirmDialog.id, confirmDialog.isFeatured)} 
                disabled={isMutating}
                className={`w-full sm:w-1/2 ${confirmDialog.isFeatured ? "bg-red-600 hover:bg-red-700" : "bg-stonehill-primary hover:bg-stonehill-dark"}`}
              >
                {isMutating ? "Processing..." : confirmDialog.isFeatured ? "Remove" : "Feature"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
