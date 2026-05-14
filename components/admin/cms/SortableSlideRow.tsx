"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableSlideRowProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SortableSlideRow({ id, children, disabled }: SortableSlideRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`
        transition-colors
        ${isDragging
          ? "bg-slate-50 shadow-lg shadow-stonehill-primary/10 ring-2 ring-stonehill-accent/40 rounded-lg opacity-95"
          : "hover:bg-slate-50/10"
        }
        ${isSorting && !isDragging ? "transition-transform duration-200" : ""}
      `}
    >
      {/* Drag handle cell */}
      <td className="w-10 pl-3 pr-0 py-4">
        <button
          type="button"
          className={`
            flex items-center justify-center w-8 h-8 rounded
            text-slate-900/30 hover:text-slate-900/70
            hover:bg-slate-50/60
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
      </td>
      {children}
    </tr>
  );
}
