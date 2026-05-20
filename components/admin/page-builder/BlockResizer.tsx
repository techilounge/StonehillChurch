"use client";

import * as React from "react";
import { PageBlock, PageBuilderSection } from "@/types/pageBuilder";
import { usePageBuilder } from "./PageBuilderContext";

const MIN_SIZE_PX = 150;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface BlockResizerProps {
  block: PageBlock;
  sectionId: string;
  columnId?: string;
  isSelected: boolean;
}

export interface ColumnResizeResult {
  leftWidthPct: number;
  rightWidthPct: number;
}

export interface MediaResizeResult {
  nextWidth: number;
  nextHeight: number;
}

/** Parse a column width string ("50%", "1/2", "auto", etc.) to a percentage number. */
function parseColWidth(width: string | undefined, numCols: number): number {
  if (!width) return 100 / numCols;
  if (width.endsWith("%")) return parseFloat(width);
  if (width === "1/2") return 50;
  if (width === "1/3") return 33.33;
  if (width === "2/3") return 66.67;
  if (width === "1/4") return 25;
  if (width === "3/4") return 75;
  if (width === "full") return 100;
  if (width === "auto") return 100 / numCols;
  const parsed = parseFloat(width);
  return isNaN(parsed) ? 100 / numCols : parsed;
}

/**
 * Pure helper function to calculate new column percentage widths during dragging.
 */
export function calculateColumnResize(
  dx: number,
  isLeftDragging: boolean,
  leftInitialPct: number,
  rightInitialPct: number,
  leftInitialWidthPx: number,
  rightInitialWidthPx: number,
  minWidthPct: number = 10
): ColumnResizeResult {
  const combinedPct = leftInitialPct + rightInitialPct;
  const combinedWidthPx = leftInitialWidthPx + rightInitialWidthPx;
  if (combinedWidthPx <= 0) {
    return { leftWidthPct: leftInitialPct, rightWidthPct: rightInitialPct };
  }

  let newLeftWidthPx: number;
  if (isLeftDragging) {
    newLeftWidthPx = leftInitialWidthPx + dx;
  } else {
    const newRightWidthPx = rightInitialWidthPx + dx;
    newLeftWidthPx = combinedWidthPx - newRightWidthPx;
  }

  if (newLeftWidthPx < 0) newLeftWidthPx = 0;
  if (newLeftWidthPx > combinedWidthPx) newLeftWidthPx = combinedWidthPx;

  let leftWidthPct = (newLeftWidthPx / combinedWidthPx) * combinedPct;
  let rightWidthPct = combinedPct - leftWidthPct;

  if (leftWidthPct < minWidthPct) {
    leftWidthPct = minWidthPct;
    rightWidthPct = combinedPct - minWidthPct;
  } else if (rightWidthPct < minWidthPct) {
    rightWidthPct = minWidthPct;
    leftWidthPct = combinedPct - minWidthPct;
  }

  if (isNaN(leftWidthPct) || leftWidthPct < 0 || leftWidthPct > 100) leftWidthPct = leftInitialPct;
  if (isNaN(rightWidthPct) || rightWidthPct < 0 || rightWidthPct > 100) rightWidthPct = rightInitialPct;

  return {
    leftWidthPct: parseFloat(leftWidthPct.toFixed(2)),
    rightWidthPct: parseFloat(rightWidthPct.toFixed(2)),
  };
}

/**
 * Pure helper function to calculate media block resizing, handling diagonal southeast drags,
 * aspect ratio locks, and independent dimensional scaling.
 */
export function calculateMediaResize(
  dx: number,
  dy: number,
  dir: "e" | "s" | "se",
  startWidth: number,
  startHeight: number,
  aspect: number,
  locked: boolean,
  minSize: number = MIN_SIZE_PX,
  maxWidth?: number
): MediaResizeResult {
  let nextWidth = startWidth;
  let nextHeight = startHeight;

  if (locked) {
    let delta = 0;
    if (dir === "e") delta = dx;
    else if (dir === "s") delta = dy * aspect;
    else if (dir === "se") delta = Math.max(dx, dy * aspect);

    nextWidth = startWidth + delta;
    if (nextWidth < minSize) nextWidth = minSize;
    if (maxWidth !== undefined && nextWidth > maxWidth) nextWidth = maxWidth;
    
    // Proportional height
    nextHeight = nextWidth / aspect;
  } else {
    if (dir === "e" || dir === "se") {
      nextWidth = startWidth + dx;
      if (nextWidth < minSize) nextWidth = minSize;
      if (maxWidth !== undefined && nextWidth > maxWidth) nextWidth = maxWidth;
    }
    if (dir === "s" || dir === "se") {
      nextHeight = startHeight + dy;
      if (nextHeight < minSize) nextHeight = minSize;
    }
  }

  return { nextWidth, nextHeight };
}

/**
 * Drag-to-resize handles for a media block.
 * When inside a multi-column section, east/southeast drag resizes the containing column.
 * When in single-column sections, dragging resizes the block itself.
 * The southeast handle always scales width and height together correctly.
 */
export function BlockResizer({ block, sectionId, columnId, isSelected }: BlockResizerProps) {
  const { handleUpdateBlock, handleUpdateSection, formData } = usePageBuilder();
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const content = block.content || {};
  const locked = content.lockAspectRatio !== false; // default: aspect ratio locked

  const startResize = (e: React.MouseEvent, dir: "e" | "s" | "se") => {
    e.preventDefault();
    e.stopPropagation();

    const section = formData.builderData?.sections?.find((s) => s.id === sectionId);
    const columns = section?.columns;
    const isMultiCol = columns && columns.length > 1;
    const colIndex = isMultiCol ? columns.findIndex((c) => c.id === columnId) : -1;

    const sectionDom = document.querySelector(`[data-section-id="${sectionId}"]`);
    const container = sectionDom?.querySelector(`[data-block-id="${block.id}"]`) as HTMLElement | null;
    if (!container) return;

    if (isMultiCol && colIndex !== -1 && (dir === "e" || dir === "se")) {
      // MULTI-COLUMN RESIZE PATH
      const numCols = columns.length;
      const leftIndex = colIndex < numCols - 1 ? colIndex : colIndex - 1;
      const rightIndex = leftIndex + 1;

      const leftColDom = document.querySelector(`[data-column-id="${columns[leftIndex].id}"]`) as HTMLElement | null;
      const rightColDom = document.querySelector(`[data-column-id="${columns[rightIndex].id}"]`) as HTMLElement | null;
      if (!leftColDom || !rightColDom) return;

      const leftRect = leftColDom.getBoundingClientRect();
      const rightRect = rightColDom.getBoundingClientRect();

      const leftInitialPct = parseColWidth(columns[leftIndex].width, numCols);
      const rightInitialPct = parseColWidth(columns[rightIndex].width, numCols);

      const startRect = container.getBoundingClientRect();
      const startH = startRect.height;
      const aspect = startH > 0 ? startRect.width / startH : 16 / 9;
      const startX = e.clientX;
      const startY = e.clientY;

      let finalH = startH;
      let heightChanged = false;

      setIsDragging(true);
      document.body.style.userSelect = "none";
      document.body.style.cursor = dir === "se" ? "nwse-resize" : "ew-resize";

      container.style.width = "100%";

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        const isLeftDragging = leftIndex === colIndex;
        const { leftWidthPct, rightWidthPct } = calculateColumnResize(
          dx,
          isLeftDragging,
          leftInitialPct,
          rightInitialPct,
          leftRect.width,
          rightRect.width,
          10
        );

        leftColDom.style.setProperty("--col-width", `${leftWidthPct}%`);
        rightColDom.style.setProperty("--col-width", `${rightWidthPct}%`);

        // When dragging 'se', calculate what the ideal height should be for this layout change
        if (dir === "se") {
          const { nextHeight } = calculateMediaResize(dx, dy, dir, startRect.width, startH, aspect, locked, MIN_SIZE_PX);
          finalH = nextHeight;
          container.style.height = `${nextHeight}px`;
          heightChanged = true;
        }
      };

      const cleanup = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("keydown", onKeyDown);

        if (leftColDom) {
          leftColDom.style.removeProperty("--col-width");
        }
        if (rightColDom) {
          rightColDom.style.removeProperty("--col-width");
        }
        if (container) {
          container.style.width = "";
          container.style.height = "";
        }

        if (isMountedRef.current) setIsDragging(false);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };

      const onUp = () => {
        const finalLeftRect = leftColDom.getBoundingClientRect();
        const isLeftDragging = leftIndex === colIndex;
        const finalDx = finalLeftRect.width - leftRect.width;

        const { leftWidthPct, rightWidthPct } = calculateColumnResize(
          finalDx,
          isLeftDragging,
          leftInitialPct,
          rightInitialPct,
          leftRect.width,
          rightRect.width,
          10
        );

        cleanup();

        const updatedColumns = columns.map((col: any, idx: number) => {
          if (idx === leftIndex) return { ...col, width: `${leftWidthPct.toFixed(2)}%` };
          if (idx === rightIndex) return { ...col, width: `${rightWidthPct.toFixed(2)}%` };
          const colWidth = col.width || (100 / numCols) + "%";
          return { ...col, width: colWidth.endsWith("%") ? colWidth : `${parseColWidth(colWidth, numCols).toFixed(2)}%` };
        });

        handleUpdateSection(sectionId, { columns: updatedColumns });

        // Force clear width so block inherits column width. Preserve height if changed.
        const nextContent: Record<string, unknown> = { ...content, width: undefined };
        if (locked) {
          nextContent.height = undefined; // Auto scales via CSS aspect ratio
        } else if (heightChanged) {
          nextContent.height = Math.round(finalH);
        }
        handleUpdateBlock(sectionId, block.id, { content: nextContent }, columnId);
      };

      const onKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === "Escape") cleanup();
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("keydown", onKeyDown);

    } else {
      // SINGLE-COLUMN / STANDARD RESIZE FALLBACK PATH
      const column = container.parentElement;
      if (!column) return;
      const columnWidth = column.clientWidth;
      if (columnWidth <= 0) return;

      const startRect = container.getBoundingClientRect();
      const startW = startRect.width;
      const startH = startRect.height;
      const aspect = startH > 0 ? startW / startH : 16 / 9;
      const startX = e.clientX;
      const startY = e.clientY;

      let finalW = startW;
      let finalH = startH;
      let heightChanged = false;

      setIsDragging(true);
      document.body.style.userSelect = "none";
      document.body.style.cursor = dir === "e" ? "ew-resize" : dir === "s" ? "ns-resize" : "nwse-resize";

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        const { nextWidth, nextHeight } = calculateMediaResize(
          dx,
          dy,
          dir,
          startW,
          startH,
          aspect,
          locked,
          MIN_SIZE_PX,
          columnWidth
        );

        finalW = nextWidth;
        
        // Only mark height changed if we are dragging a vertical direction OR if aspect ratio is locked
        if (dir === "s" || dir === "se" || locked) {
          finalH = nextHeight;
          heightChanged = true;
        }

        container.style.width = `${finalW}px`;
        if (heightChanged) {
          container.style.height = `${finalH}px`;
        }
      };

      const cleanup = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("keydown", onKeyDown);

        if (container) {
          container.style.width = "";
          container.style.height = "";
        }

        if (isMountedRef.current) setIsDragging(false);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      };

      const onUp = () => {
        cleanup();

        const widthPct = clamp((finalW / columnWidth) * 100, 5, 100);
        const nextContent: Record<string, unknown> = { ...content, width: `${widthPct.toFixed(2)}%` };
        
        // If locked, we don't store height. CSS scales it automatically.
        // If unlocked and height changed, we store height.
        if (locked) {
          nextContent.height = undefined;
        } else if (heightChanged) {
          nextContent.height = Math.round(finalH);
        }
        
        handleUpdateBlock(sectionId, block.id, { content: nextContent }, columnId);
      };

      const onKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === "Escape") cleanup();
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      window.addEventListener("keydown", onKeyDown);
    }
  };

  const pinned = isSelected || isDragging;

  return (
    <div ref={anchorRef} aria-hidden="true">
      <div
        className={`hidden lg:block transition-opacity duration-150 ${
          pinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-10 rounded-lg ring-2 ring-stonehill-accent" />
        )}
        <button
          type="button"
          aria-label="Resize block width"
          title="Drag to resize width"
          onMouseDown={(e) => startResize(e, "e")}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto absolute top-1/2 right-0 z-20 h-10 w-3 -translate-y-1/2 translate-x-1/2 rounded-full border border-white bg-stonehill-accent shadow cursor-ew-resize transition-transform hover:scale-125"
        />
        <button
          type="button"
          aria-label="Resize block height"
          title="Drag to resize height"
          onMouseDown={(e) => startResize(e, "s")}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto absolute bottom-0 left-1/2 z-20 h-3 w-10 -translate-x-1/2 translate-y-1/2 rounded-full border border-white bg-stonehill-accent shadow cursor-ns-resize transition-transform hover:scale-125"
        />
        <button
          type="button"
          aria-label="Resize block width and height"
          title="Drag to resize"
          onMouseDown={(e) => startResize(e, "se")}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto absolute bottom-0 right-0 z-20 h-4 w-4 translate-x-1/2 translate-y-1/2 rounded-sm border-2 border-stonehill-accent bg-white shadow cursor-nwse-resize transition-transform hover:scale-125"
        />
      </div>
    </div>
  );
}
