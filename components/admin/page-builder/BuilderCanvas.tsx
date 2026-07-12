import * as React from "react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Layout, Plus, Monitor, Tablet, Smartphone } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { usePageBuilder, getColumnBlocks } from "./PageBuilderContext";
import { SortableSection } from "./SortableSection";
import { PatternPickerModal } from "./PatternPickerModal";

// Approximate breakpoints for the canvas device preview. Match the public
// renderer's media-query breakpoints so what you see in the editor at each
// device width matches the live site.
const DEVICE_MAX_WIDTH: Record<"desktop" | "tablet" | "mobile", string | undefined> = {
  desktop: undefined,
  tablet: "1024px",
  mobile: "640px",
};

export function BuilderCanvas() {
  const {
    formData,
    handleAddSection,
    handleReorderSections,
    handleReorderBlocks,
    handleInsertTemplate,
    handleMoveBlock,
    devicePreview,
    setDevicePreview,
    spacingTokens,
    canModifyLayout,
  } = usePageBuilder();
  const builderData = formData.builderData || { version: "1.0", sections: [] };
  const [activeDragType, setActiveDragType] = React.useState<"section" | "block" | null>(null);
  const [isPatternPickerOpen, setIsPatternPickerOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => { setIsMounted(true); }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDragType(event.active.data.current?.type || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragType(null);
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    if (active.data.current?.type === "block") {
      const fromSectionId = active.data.current.sectionId;
      const fromColumnId = active.data.current.columnId;

      if (over.data.current?.type === "block") {
        const toSectionId = over.data.current.sectionId;
        const toColumnId = over.data.current.columnId;

        if (fromSectionId === toSectionId && fromColumnId === toColumnId) {
          const section = builderData.sections.find((s: any) => s.id === fromSectionId);
          if (section) {
            const blocks = getColumnBlocks(section, fromColumnId);
            const oldIndex = blocks.findIndex((b: any) => b.id === active.id);
            const newIndex = blocks.findIndex((b: any) => b.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
              handleReorderBlocks(fromSectionId, oldIndex, newIndex, fromColumnId);
            }
          }
        } else {
          // Cross-section or cross-column drag and drop
          const section = builderData.sections.find((s: any) => s.id === toSectionId);
          if (section) {
            const blocks = getColumnBlocks(section, toColumnId);
            const newIndex = blocks.findIndex((b: any) => b.id === over.id);
            handleMoveBlock(
              fromSectionId,
              toSectionId,
              active.id as string,
              fromColumnId,
              toColumnId,
              newIndex !== -1 ? newIndex : undefined
            );
          }
        }
      } else if (over.data.current?.type === "column") {
        const toSectionId = over.data.current.sectionId;
        const toColumnId = over.data.current.columnId;

        handleMoveBlock(
          fromSectionId,
          toSectionId,
          active.id as string,
          fromColumnId,
          toColumnId
        );
      }
    } else if (active.data.current?.type === "section" && over.data.current?.type === "section") {
      const oldIndex = builderData.sections.findIndex((s: any) => s.id === active.id);
      const newIndex = builderData.sections.findIndex((s: any) => s.id === over.id);
      handleReorderSections(oldIndex, newIndex);
    }
  }

  const canvasMaxWidth = DEVICE_MAX_WIDTH[devicePreview];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layout className="h-5 w-5 text-stonehill-accent" />
          Page Builder
        </h2>
        <div
          role="tablist"
          aria-label="Canvas device preview"
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5"
        >
          {[
            { value: "desktop" as const, label: "Desktop", Icon: Monitor },
            { value: "tablet" as const, label: "Tablet", Icon: Tablet },
            { value: "mobile" as const, label: "Mobile", Icon: Smartphone },
          ].map(({ value, label, Icon }) => {
            const active = devicePreview === value;
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setDevicePreview(value)}
                title={label}
                className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors ${
                  active
                    ? "bg-stonehill-accent/10 text-stonehill-accent font-semibold"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={
          canvasMaxWidth
            ? "mx-auto motion-safe:transition-[max-width] duration-200 rounded-lg ring-1 ring-slate-200 bg-slate-50/40 p-2"
            : "motion-safe:transition-[max-width] duration-200"
        }
        style={{
          ...(canvasMaxWidth ? { maxWidth: canvasMaxWidth } : {}),
          // Expose the same CSS custom properties as the public renderer so
          // token-mode spacing (`var(--pb-space-md)`) resolves on the canvas
          // too. Changing tokens in Settings updates the canvas preview live
          // because spacingTokens flows in from the server-side prop.
          ["--pb-space-xs" as any]: `${spacingTokens.xs}px`,
          ["--pb-space-sm" as any]: `${spacingTokens.sm}px`,
          ["--pb-space-md" as any]: `${spacingTokens.md}px`,
          ["--pb-space-lg" as any]: `${spacingTokens.lg}px`,
          ["--pb-space-xl" as any]: `${spacingTokens.xl}px`,
        }}
      >
      {builderData.sections.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <Layout className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Start building this page</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Add a section to begin creating your layout, or start with a pre-built template.
          </p>
          {canModifyLayout ? (
            <div className="flex gap-3">
              <Button variant="primary" onClick={handleAddSection}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
              <Button variant="outline" onClick={() => setIsPatternPickerOpen(true)}>
                Insert Template
              </Button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Layout edits are disabled for Editor accounts.</p>
          )}
        </div>
      ) : !isMounted ? (
        <div className="space-y-4">
          {builderData.sections.map((section: any) => (
            <div key={section.id} className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-24 mb-4" />
              <div className="h-24 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={activeDragType === "section" ? [restrictToVerticalAxis] : undefined}
        >
          <SortableContext 
            items={builderData.sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {builderData.sections.map((section: any, index: number) => (
                <SortableSection key={section.id} section={section} index={index} totalSections={builderData.sections.length} />
              ))}
              
              {canModifyLayout && (
                <div className="flex justify-center gap-3 pt-4 pb-12">
                  <Button variant="outline" onClick={handleAddSection}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                  <Button variant="outline" onClick={() => setIsPatternPickerOpen(true)}>
                    Insert Template
                  </Button>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}
      </div>

      <PatternPickerModal
        isOpen={isPatternPickerOpen}
        onClose={() => setIsPatternPickerOpen(false)}
        onSelect={handleInsertTemplate}
      />
    </div>
  );
}
