"use client";

import React, { useRef, useState } from "react";
import { usePageBuilder } from "./PageBuilderContext";

export function ColumnResizeSeparator({ 
  sectionId, 
  leftIndex, 
  rightIndex, 
  columns 
}: { 
  sectionId: string; 
  leftIndex: number; 
  rightIndex: number; 
  columns: any[]; 
}) {
  const { handleUpdateSection } = usePageBuilder();
  const separatorRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Parse width string to percentage
  const parseWidth = (widthStr: string | undefined, numCols: number): number => {
    if (!widthStr) return 100 / numCols;
    if (widthStr.endsWith("%")) return parseFloat(widthStr);
    if (widthStr === "1/2") return 50;
    if (widthStr === "1/3") return 33.33;
    if (widthStr === "2/3") return 66.67;
    if (widthStr === "1/4") return 25;
    if (widthStr === "3/4") return 75;
    if (widthStr === "full") return 100;
    if (widthStr === "auto") return 100 / numCols;
    const parsed = parseFloat(widthStr);
    return isNaN(parsed) ? (100 / numCols) : parsed;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const separator = separatorRef.current;
    if (!separator) return;

    // Previous DOM sibling is the left column; next is the right column
    const leftCol = separator.previousElementSibling as HTMLElement;
    const rightCol = separator.nextElementSibling as HTMLElement;
    if (!leftCol || !rightCol) return;

    setIsDragging(true);

    const leftRect = leftCol.getBoundingClientRect();
    const rightRect = rightCol.getBoundingClientRect();
    const combinedWidthPx = leftRect.width + rightRect.width;

    const numCols = columns.length;
    const leftInitialPct = parseWidth(columns[leftIndex].width, numCols);
    const rightInitialPct = parseWidth(columns[rightIndex].width, numCols);
    const combinedPct = leftInitialPct + rightInitialPct;

    const startX = e.clientX;
    const minPct = 10;

    let finalLeftPct = leftInitialPct;
    let finalRightPct = rightInitialPct;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;

      // Calculate new width in pixels for the left column
      let newLeftWidthPx = leftRect.width + deltaX;
      if (newLeftWidthPx < 0) newLeftWidthPx = 0;

      // Calculate new percentages
      let newLeftPct = (newLeftWidthPx / combinedWidthPx) * combinedPct;
      let newRightPct = combinedPct - newLeftPct;

      // Enforce minimum width of 10%
      if (newLeftPct < minPct) {
        newLeftPct = minPct;
        newRightPct = combinedPct - minPct;
      } else if (newRightPct < minPct) {
        newRightPct = minPct;
        newLeftPct = combinedPct - minPct;
      }

      finalLeftPct = newLeftPct;
      finalRightPct = newRightPct;

      // Columns derive their width from the --col-width custom property
      // (.responsive-col in globals.css applies it with !important). Setting
      // width/flex inline would be overridden, so update the variable itself.
      leftCol.style.setProperty("--col-width", `${newLeftPct}%`);
      rightCol.style.setProperty("--col-width", `${newRightPct}%`);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);

      // Save to state
      const updatedColumns = columns.map((col, idx) => {
        if (idx === leftIndex) {
          return { ...col, width: `${finalLeftPct.toFixed(2)}%` };
        }
        if (idx === rightIndex) {
          return { ...col, width: `${finalRightPct.toFixed(2)}%` };
        }
        // Preserve other columns, normalising them to % format
        const colWidth = col.width || (100 / numCols) + "%";
        return { 
          ...col, 
          width: colWidth.endsWith("%") ? colWidth : `${parseWidth(colWidth, numCols).toFixed(2)}%` 
        };
      });

      handleUpdateSection(sectionId, { columns: updatedColumns });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={separatorRef}
      onMouseDown={handleMouseDown}
      className="hidden md:flex self-stretch w-4 -mx-2 cursor-col-resize items-center justify-center z-20 select-none group relative transition-colors duration-200"
      title="Drag to resize columns"
    >
      <div 
        className={`w-1 h-full rounded transition-all duration-200 ${
          isDragging 
            ? "bg-stonehill-accent w-1.5 shadow-sm" 
            : "bg-slate-200 group-hover:bg-stonehill-accent hover:w-1.5"
        }`} 
        style={{ minHeight: "100px" }}
      />
    </div>
  );
}
