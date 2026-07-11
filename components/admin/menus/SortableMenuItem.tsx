"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/shared/Button";
import type { MenuItem } from "@/types/menus";

interface SortableMenuItemProps {
  item: MenuItem;
  depth: number;
  disabled?: boolean;
  canIndent: boolean;
  canOutdent: boolean;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onIndent: (id: string) => void;
  onOutdent: (id: string) => void;
}

export function SortableMenuItem({
  item,
  depth,
  disabled,
  canIndent,
  canOutdent,
  onEdit,
  onDelete,
  onIndent,
  onOutdent,
}: SortableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ id: item.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" : undefined,
  };

  const isExternal = item.url.startsWith("http://") || item.url.startsWith("https://");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-3 rounded-xl border px-3 py-3 transition-all
        ${isDragging
          ? "bg-white shadow-lg shadow-stonehill-primary/10 ring-2 ring-stonehill-accent/40 border-stonehill-accent/40"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
        }
        ${isSorting && !isDragging ? "transition-transform duration-200" : ""}
        ${depth === 1 ? "ml-10 border-l-4 border-l-stonehill-primary/20" : ""}
      `}
    >
      {/* Drag handle */}
      <button
        type="button"
        className={`
          flex items-center justify-center w-8 h-8 rounded-lg shrink-0
          text-slate-300 hover:text-slate-500 hover:bg-slate-50
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent
          transition-colors
          ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}
        `}
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Item info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-slate-900 truncate">{item.label}</span>
          {item.openInNewTab && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
              <ArrowUpRight className="h-2.5 w-2.5" />
              New Tab
            </span>
          )}
          {isExternal && (
            <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
          )}
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">{item.url}</p>
      </div>

      {/* Nesting controls */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {canOutdent && (
          <button
            type="button"
            onClick={() => onOutdent(item.id)}
            disabled={disabled}
            className="flex items-center justify-center w-7 h-7 rounded-full border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-30"
            title="Move to top level"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
        {canIndent && (
          <button
            type="button"
            onClick={() => onIndent(item.id)}
            disabled={disabled}
            className="flex items-center justify-center w-7 h-7 rounded-full border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-30"
            title="Nest under previous item"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-stonehill-primary"
          onClick={() => onEdit(item)}
          disabled={disabled}
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
          onClick={() => onDelete(item.id)}
          disabled={disabled}
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
