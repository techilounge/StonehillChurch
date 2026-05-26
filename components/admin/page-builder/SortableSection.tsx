import * as React from "react";
import { useSortable, SortableContext, verticalListSortingStrategy, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { PageBuilderSection, BlockType } from "@/types/pageBuilder";
import { usePageBuilder } from "./PageBuilderContext";
import { BlockRenderer } from "./BlockRenderer";
import { ColumnResizeSeparator } from "./ColumnResizeSeparator";
import { ChevronUp, ChevronDown, Copy, Trash2 } from "lucide-react";

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
 * Cross-axis alignment for the column row. Literal class strings so Tailwind's
 * static scan picks them up. Default is `start` (auto height) so a short column
 * never stretches to a taller sibling and leave dead space.
 */
const COLUMN_ALIGN_CLASS: Record<string, string> = {
  start: "md:items-start",
  center: "md:items-center",
  end: "md:items-end",
  stretch: "md:items-stretch",
};

interface SortableSectionProps {
  section: PageBuilderSection;
  index: number;
  totalSections: number;
}

export function SortableSection({ section, index, totalSections }: SortableSectionProps) {
  const {
    selectedElementId,
    setSelectedElementId,
    handleRemoveSection,
    handleReorderSections,
    handleDuplicateSection,
    handleAddBlock,
    handleRemoveBlock,
    handleAddRow,
    handleRemoveRow,
    handleDuplicateRow,
    handleReorderRows,
  } = usePageBuilder();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: section.id,
    data: { type: "section" }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = selectedElementId === section.id;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      data-section-id={section.id}
      className={`relative group bg-white border rounded-xl transition-all ${
        isSelected 
          ? "border-stonehill-accent ring-1 ring-stonehill-accent shadow-sm" 
          : "border-slate-200 hover:border-slate-300 shadow-sm"
      }`}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedElementId(section.id);
      }}
    >
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3 p-1.5 bg-white border border-slate-200 rounded-md shadow-sm cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Drag to reorder section"
        title="Drag to reorder section"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>

      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1">
        <button 
          className="h-7 w-7 flex items-center justify-center rounded bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200 transition-colors disabled:opacity-30"
          onClick={(e) => {
            e.stopPropagation();
            handleReorderSections(index, index - 1);
          }}
          disabled={index === 0}
          title="Move section up"
          aria-label="Move section up"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button 
          className="h-7 w-7 flex items-center justify-center rounded bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200 transition-colors disabled:opacity-30"
          onClick={(e) => {
            e.stopPropagation();
            handleReorderSections(index, index + 1);
          }}
          disabled={index === totalSections - 1}
          title="Move section down"
          aria-label="Move section down"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button 
          className="h-7 w-7 flex items-center justify-center rounded bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleDuplicateSection(section.id);
          }}
          title="Duplicate section"
          aria-label="Duplicate section"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button 
          className="h-7 w-7 flex items-center justify-center rounded bg-white text-red-500 hover:bg-red-50 hover:text-red-700 border border-slate-200 hover:border-red-100 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveSection(section.id);
          }}
          title="Remove section"
          aria-label="Remove section"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Section {index + 1}
          </span>
          {section.layout && section.layout !== "1-col" && (
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {section.layout}
            </span>
          )}
        </div>
        
        {/* Render Content */}
        <div 
          className={`space-y-4 ${section.style?.padding || 'py-12'} ${section.style?.backgroundColor ? '' : 'bg-slate-50 border border-slate-100 rounded-lg'} min-h-[120px] p-4`} 
          style={{ 
            backgroundColor: section.style?.backgroundColor !== "#ffffff" ? section.style?.backgroundColor : undefined,
            color: section.style?.textColor
          }}
        >
          {(section.rows ?? []).map((row, rowIndex) => {
            const totalRows = section.rows?.length ?? 0;
            const isRowSelected = selectedElementId === row.id;
            const colAlignClass = COLUMN_ALIGN_CLASS[row.style?.alignItems || "start"];
            const isMultiCol = row.columns.length > 1;
            return (
              <div
                key={row.id}
                data-row-id={row.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElementId(row.id);
                }}
                className={`relative group/row rounded-lg transition-colors ${
                  isRowSelected ? "ring-1 ring-stonehill-accent" : ""
                } ${row.style?.padding || "p-2"}`}
                style={{
                  backgroundColor:
                    row.style?.backgroundColor && row.style.backgroundColor !== "#ffffff"
                      ? row.style.backgroundColor
                      : undefined,
                  color: row.style?.textColor,
                }}
              >
                {/* Row toolbar */}
                <div className="absolute top-1 right-1 z-10 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReorderRows(section.id, rowIndex, rowIndex - 1); }}
                    disabled={rowIndex === 0}
                    title="Move row up"
                    aria-label="Move row up"
                    className="h-6 w-6 flex items-center justify-center rounded bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200 shadow-sm transition-colors disabled:opacity-30"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReorderRows(section.id, rowIndex, rowIndex + 1); }}
                    disabled={rowIndex === totalRows - 1}
                    title="Move row down"
                    aria-label="Move row down"
                    className="h-6 w-6 flex items-center justify-center rounded bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200 shadow-sm transition-colors disabled:opacity-30"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded shadow-sm opacity-80 uppercase tracking-wider font-mono">
                    Row
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDuplicateRow(section.id, row.id); }}
                    title="Duplicate row"
                    aria-label="Duplicate row"
                    className="h-6 w-6 flex items-center justify-center rounded bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200 shadow-sm transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveRow(section.id, row.id); }}
                    disabled={totalRows <= 1}
                    title={totalRows <= 1 ? "A section needs at least one row" : "Remove row"}
                    aria-label="Remove row"
                    className="h-6 w-6 flex items-center justify-center rounded bg-white text-red-500 hover:bg-red-50 hover:text-red-700 border border-slate-200 hover:border-red-100 shadow-sm transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* Row's columns */}
                <div
                  className={`flex flex-col md:flex-row ${colAlignClass} ${!isMultiCol ? "space-y-4 md:space-y-0" : ""}`}
                >
                  {row.columns.map((column, colIndex) => {
                    const numCols = row.columns.length;
                    const colPct = parseColWidth(column.width, numCols);
                    return (
                      <React.Fragment key={column.id}>
                        {colIndex > 0 && (
                          <ColumnResizeSeparator
                            sectionId={section.id}
                            rowId={row.id}
                            leftIndex={colIndex - 1}
                            rightIndex={colIndex}
                            columns={row.columns}
                          />
                        )}
                        <div
                          data-column-id={column.id}
                          className="responsive-col flex flex-col min-h-[100px] border border-dashed border-slate-300/50 rounded-lg p-3 bg-white/10"
                          style={{ "--col-width": `${colPct}%` } as React.CSSProperties}
                        >
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-wider flex justify-between items-center">
                            <span className="opacity-70">Column {colIndex + 1}</span>
                            <span className="bg-slate-200/50 text-slate-600 px-1.5 py-0.5 rounded text-[9px] tabular-nums">
                              {Math.round(colPct)}%
                            </span>
                          </div>
                          <SortableContext
                            items={column.blocks?.map((b) => b.id) || []}
                            strategy={rectSortingStrategy}
                          >
                            <div className="space-y-3 flex-1 mb-4">
                              {column.blocks && column.blocks.length > 0 ? (
                                column.blocks.map((block, i) => (
                                  <SortableBlock
                                    key={block.id}
                                    block={block}
                                    sectionId={section.id}
                                    columnId={column.id}
                                    index={i}
                                    totalBlocks={column.blocks!.length}
                                  />
                                ))
                              ) : (
                                <div className="flex flex-col items-center justify-center text-slate-400 h-full py-4 opacity-50">
                                  <span className="text-xs">Empty Column</span>
                                </div>
                              )}
                            </div>
                          </SortableContext>
                          <AddBlockMenu onAdd={(type) => handleAddBlock(section.id, type, column.id)} />
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Add Row button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleAddRow(section.id); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-white border border-dashed border-slate-300 rounded-md hover:border-stonehill-accent hover:text-stonehill-accent transition-colors shadow-sm"
            >
              <Plus className="h-3 w-3" />
              Add Row
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddBlockMenu({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const basicBlocks: BlockType[] = ["heading", "paragraph", "image", "button", "divider", "spacer"];
  const advancedBlocks: BlockType[] = ["video", "card", "iconText", "cta"];

  if (!isOpen) {
    return (
      <div className="flex justify-center mt-2 pt-4 border-t border-slate-200/50 border-dashed opacity-60 hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-md hover:border-stonehill-accent hover:text-stonehill-accent transition-colors shadow-sm"
        >
          <Plus className="h-3 w-3" />
          Add Block
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-200/50 border-dashed animate-in fade-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Add New Block</span>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium"
          >
            Cancel
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Basic</span>
            <div className="flex flex-wrap gap-2">
              {basicBlocks.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    onAdd(type);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-700 rounded-md hover:border-stonehill-accent hover:text-stonehill-accent bg-slate-50 hover:bg-white transition-all flex items-center gap-1.5 capitalize"
                >
                  <Plus className="h-3 w-3 text-slate-400" />
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Advanced</span>
            <div className="flex flex-wrap gap-2">
              {advancedBlocks.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    onAdd(type);
                    setIsOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-700 rounded-md hover:border-stonehill-accent hover:text-stonehill-accent bg-slate-50 hover:bg-white transition-all flex items-center gap-1.5 capitalize"
                >
                  <Plus className="h-3 w-3 text-slate-400" />
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableBlock({ block, sectionId, columnId, index, totalBlocks }: { block: any, sectionId: string, columnId?: string, index: number, totalBlocks: number }) {
  const { 
    selectedElementId, 
    setSelectedElementId, 
    handleRemoveBlock 
  } = usePageBuilder();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: block.id,
    data: { type: "block", sectionId, columnId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 p-1 bg-white border border-slate-200 rounded shadow-sm cursor-grab opacity-0 focus-within:opacity-100 group-hover:opacity-100 transition-opacity z-10"
        aria-label="Drag to reorder block"
        title="Drag to reorder block"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3 text-slate-400" />
      </div>
      <BlockRenderer 
        block={block} 
        isSelected={selectedElementId === block.id}
        index={index}
        totalBlocks={totalBlocks}
        sectionId={sectionId}
        columnId={columnId}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedElementId(block.id);
        }}
        onRemove={(e) => {
          e.stopPropagation();
          handleRemoveBlock(sectionId, block.id, columnId);
        }}
      />
    </div>
  );
}

