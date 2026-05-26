import * as React from "react";
import { Settings } from "lucide-react";
import { SelectInput } from "@/components/forms/SelectInput";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { Button } from "@/components/shared/Button";
import { usePageBuilder } from "./PageBuilderContext";
import { PageBlock, PageBuilderRow, PageBuilderSection } from "@/types/pageBuilder";
import { MediaSelectorDialog } from "@/components/admin/media/MediaSelectorDialog";
import { isValidSafeUrl } from "@/lib/pageBuilderSafety";
import { extractYouTubeVideoId } from "@/lib/youtube";

export function BuilderInspector() {
  const {
    formData,
    selectedElementId,
    handleUpdateSection,
    handleChangeSectionLayout,
    handleUpdateBlock,
    handleUpdateRow,
    handleChangeRowLayout,
  } = usePageBuilder();
  const builderData = formData.builderData || { version: "1.0", sections: [] };

  const [isMediaOpen, setIsMediaOpen] = React.useState(false);
  const [mediaTarget, setMediaTarget] = React.useState<{
    sectionId: string;
    blockId: string;
    field: string;
    columnId?: string;
  } | null>(null);

  // Resolve the selected element. It can be a section, row, or block — the
  // block can live either directly on the section (legacy), inside
  // section.columns (legacy), or inside section.rows[].columns[].
  let selectedSection: PageBuilderSection | undefined;
  let selectedRow: PageBuilderRow | undefined;
  let selectedBlock: PageBlock | undefined;
  let selectedColumnId: string | undefined;

  outer: for (const section of builderData.sections) {
    if (section.id === selectedElementId) {
      selectedSection = section;
      break outer;
    }

    const directBlock = section.blocks?.find((b) => b.id === selectedElementId);
    if (directBlock) {
      selectedSection = section;
      selectedBlock = directBlock;
      break outer;
    }

    if (section.columns) {
      for (const col of section.columns) {
        const cb = col.blocks?.find((b) => b.id === selectedElementId);
        if (cb) {
          selectedSection = section;
          selectedBlock = cb;
          selectedColumnId = col.id;
          break outer;
        }
      }
    }

    if (section.rows) {
      for (const row of section.rows) {
        if (row.id === selectedElementId) {
          selectedSection = section;
          selectedRow = row;
          break outer;
        }
        for (const col of row.columns) {
          const cb = col.blocks?.find((b) => b.id === selectedElementId);
          if (cb) {
            selectedSection = section;
            selectedBlock = cb;
            selectedColumnId = col.id;
            break outer;
          }
        }
      }
    }
  }

  const handleMediaSelect = (url: string) => {
    if (mediaTarget && selectedBlock && selectedBlock.id === mediaTarget.blockId) {
      const { sectionId, blockId, field, columnId } = mediaTarget;
      handleUpdateBlock(sectionId, blockId, {
        content: {
          ...selectedBlock.content,
          [field]: url
        }
      }, columnId);
    }
  };

  if (!selectedElementId) {
    return (
      <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col flex-none overflow-y-auto">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 sticky top-0">
          <h3 className="font-semibold text-slate-900 text-sm">Inspector</h3>
        </div>
        <div className="p-4 flex flex-col items-center justify-center text-center py-12 text-slate-400">
          <Settings className="h-8 w-8 mb-3 opacity-20" />
          <p className="text-sm">Select a section or block to edit its properties.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col flex-none overflow-y-auto">
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 sticky top-0">
        <h3 className="font-semibold text-slate-900 text-sm">
          {selectedBlock ? "Block Settings" : selectedRow ? "Row Settings" : "Section Settings"}
        </h3>
      </div>
      <div className="p-4 space-y-6">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
          <span className="text-xs font-mono text-slate-500 break-all">ID: {selectedElementId}</span>
        </div>

        {selectedBlock ? (
          <BlockInspector
            sectionId={selectedSection!.id}
            block={selectedBlock}
            onChange={(updates) => handleUpdateBlock(selectedSection!.id, selectedBlock!.id, updates, selectedColumnId)}
            onOpenMediaSelector={(field) => {
              setMediaTarget({
                sectionId: selectedSection!.id,
                blockId: selectedBlock!.id,
                field,
                columnId: selectedColumnId,
              });
              setIsMediaOpen(true);
            }}
          />
        ) : selectedRow ? (
          <RowInspector
            row={selectedRow}
            onChange={(updates) => handleUpdateRow(selectedSection!.id, selectedRow!.id, updates)}
            onLayoutChange={(layout) => handleChangeRowLayout(selectedSection!.id, selectedRow!.id, layout)}
          />
        ) : selectedSection ? (
          <SectionInspector
            section={selectedSection}
            onChange={(updates) => handleUpdateSection(selectedSection!.id, updates)}
            onLayoutChange={(layout) => handleChangeSectionLayout(selectedSection!.id, layout)}
          />
        ) : null}
      </div>

      <MediaSelectorDialog
        isOpen={isMediaOpen}
        onClose={() => {
          setIsMediaOpen(false);
          setMediaTarget(null);
        }}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}

function SectionInspector({ section, onChange, onLayoutChange }: {
  section: PageBuilderSection,
  onChange: (updates: Partial<PageBuilderSection>) => void,
  onLayoutChange: (layout: NonNullable<PageBuilderSection["layout"]>) => void,
}) {
  // Sections that have been migrated to the rows shape configure layout
  // per row, so the legacy section-level layout/alignment controls are
  // hidden in that case.
  const usesRows = !!section.rows && section.rows.length > 0;
  return (
    <>
      {!usesRows && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Layout Structure</label>
          <SelectInput
            value={section.layout || "1-col"}
            onChange={(e) => onLayoutChange(e.target.value as NonNullable<PageBuilderSection["layout"]>)}
          >
            <option value="1-col">Single Column</option>
            <option value="2-col">Two Columns (1:1)</option>
            <option value="3-col">Three Columns (1:1:1)</option>
            <option value="4-col">Four Columns (1:1:1:1)</option>
            <option value="left-sidebar">Left Sidebar (1:3)</option>
            <option value="right-sidebar">Right Sidebar (3:1)</option>
          </SelectInput>
        </div>
      )}

      {!usesRows && section.layout && section.layout !== "1-col" && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Column Vertical Alignment</label>
          <SelectInput
            value={section.style?.alignItems || "start"}
            onChange={(e) => onChange({ style: { ...section.style, alignItems: e.target.value as NonNullable<PageBuilderSection["style"]>["alignItems"] } })}
          >
            <option value="start">Top — auto height (recommended)</option>
            <option value="stretch">Stretch — equal height</option>
            <option value="center">Center</option>
            <option value="end">Bottom</option>
          </SelectInput>
          <p className="text-xs text-slate-500">Top lets each column shrink to its own content. Stretch forces all columns to equal height.</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Content Width</label>
        <SelectInput 
          value={section.style?.layoutWidth || "content"} 
          onChange={(e) => onChange({ style: { ...section.style, layoutWidth: e.target.value as any } })}
        >
          <option value="content">Boxed (Content Width)</option>
          <option value="full">Full Width</option>
        </SelectInput>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Padding</label>
        <SelectInput 
          value={section.style?.padding || "py-12"} 
          onChange={(e) => onChange({ style: { ...section.style, padding: e.target.value } })}
        >
          <option value="py-0">None (0px)</option>
          <option value="py-6">Small (24px)</option>
          <option value="py-12">Medium (48px)</option>
          <option value="py-24">Large (96px)</option>
        </SelectInput>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Background Color</label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "#ffffff", label: "White" },
            { value: "#fbfaf6", label: "Cream (Stonehill Bg)" },
            { value: "#1e3f66", label: "Navy (Primary)" },
            { value: "#1c6b8d", label: "Blue (Secondary)" },
            { value: "#8eb5c7", label: "Light Blue" },
            { value: "#e7ab10", label: "Gold (Accent)" },
          ].map(color => (
            <button
              key={color.value}
              className={`w-8 h-8 rounded border transition-all ${
                section.style?.backgroundColor === color.value 
                  ? "border-stonehill-accent ring-2 ring-stonehill-accent ring-offset-1 scale-110" 
                  : "border-slate-200 hover:scale-105"
              }`}
              style={{ backgroundColor: color.value }}
              onClick={() => onChange({ style: { ...section.style, backgroundColor: color.value } })}
              title={color.label}
              type="button"
            />
          ))}
        </div>
      </div>
    </>
  );
}

function RowInspector({ row, onChange, onLayoutChange }: {
  row: PageBuilderRow,
  onChange: (updates: Partial<PageBuilderRow>) => void,
  onLayoutChange: (layout: NonNullable<PageBuilderRow["layout"]>) => void,
}) {
  const isMultiCol = row.columns.length > 1;
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Row Layout</label>
        <SelectInput
          value={row.layout || "1-col"}
          onChange={(e) => onLayoutChange(e.target.value as NonNullable<PageBuilderRow["layout"]>)}
        >
          <option value="1-col">Single Column</option>
          <option value="2-col">Two Columns (1:1)</option>
          <option value="3-col">Three Columns (1:1:1)</option>
          <option value="4-col">Four Columns (1:1:1:1)</option>
          <option value="left-sidebar">Left Sidebar (1:3)</option>
          <option value="right-sidebar">Right Sidebar (3:1)</option>
        </SelectInput>
        <p className="text-xs text-slate-500">Drag the bar between columns in the canvas to fine-tune widths.</p>
      </div>

      {isMultiCol && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Column Vertical Alignment</label>
          <SelectInput
            value={row.style?.alignItems || "start"}
            onChange={(e) => onChange({ style: { ...row.style, alignItems: e.target.value as NonNullable<PageBuilderRow["style"]>["alignItems"] } })}
          >
            <option value="start">Top — auto height (recommended)</option>
            <option value="stretch">Stretch — equal height</option>
            <option value="center">Center</option>
            <option value="end">Bottom</option>
          </SelectInput>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Padding</label>
        <SelectInput
          value={row.style?.padding || ""}
          onChange={(e) => onChange({ style: { ...row.style, padding: e.target.value } })}
        >
          <option value="">None</option>
          <option value="p-2">XS (8px)</option>
          <option value="p-4">Small (16px)</option>
          <option value="p-6">Medium (24px)</option>
          <option value="p-8">Large (32px)</option>
          <option value="py-6">Vertical only — Small</option>
          <option value="py-12">Vertical only — Medium</option>
          <option value="py-24">Vertical only — Large</option>
        </SelectInput>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Background Color</label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "#ffffff", label: "White" },
            { value: "#fbfaf6", label: "Cream (Stonehill Bg)" },
            { value: "#1e3f66", label: "Navy (Primary)" },
            { value: "#1c6b8d", label: "Blue (Secondary)" },
            { value: "#8eb5c7", label: "Light Blue" },
            { value: "#e7ab10", label: "Gold (Accent)" },
          ].map((color) => (
            <button
              key={color.value}
              type="button"
              className={`w-8 h-8 rounded border transition-all ${
                row.style?.backgroundColor === color.value
                  ? "border-stonehill-accent ring-2 ring-stonehill-accent ring-offset-1 scale-110"
                  : "border-slate-200 hover:scale-105"
              }`}
              style={{ backgroundColor: color.value }}
              onClick={() => onChange({ style: { ...row.style, backgroundColor: color.value } })}
              title={color.label}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function BlockInspector({
  block,
  onChange,
  onOpenMediaSelector
}: {
  sectionId: string,
  block: PageBlock,
  onChange: (updates: Partial<PageBlock>) => void,
  onOpenMediaSelector: (field: string) => void
}) {
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Block Type</label>
        <div className="text-sm font-medium capitalize">{block.type}</div>
      </div>

      {block.type === "heading" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Text</label>
            <TextInput 
              value={block.content.text || ""} 
              onChange={(e) => onChange({ content: { ...block.content, text: e.target.value } })}
            />
            {(!block.content.text || block.content.text.trim() === "") && (
              <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ Heading text is recommended.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Level</label>
            <SelectInput 
              value={block.content.level || "h2"} 
              onChange={(e) => onChange({ content: { ...block.content, level: e.target.value } })}
            >
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
            </SelectInput>
          </div>
        </>
      )}

      {block.type === "paragraph" && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Text</label>
          <TextArea 
            value={block.content.text || ""} 
            onChange={(e) => onChange({ content: { ...block.content, text: e.target.value } })}
            rows={5}
          />
          {(!block.content.text || block.content.text.trim() === "") && (
            <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ Paragraph text is recommended.</p>
          )}
        </div>
      )}

      {block.type === "button" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Label</label>
            <TextInput 
              value={block.content.label || block.content.text || ""} 
              onChange={(e) => onChange({ content: { ...block.content, label: e.target.value, text: e.target.value } })}
            />
            {(!block.content.label || block.content.label.trim() === "") && (
              <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ Button label is required.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">URL</label>
            <TextInput 
              value={block.content.url || ""} 
              onChange={(e) => onChange({ content: { ...block.content, url: e.target.value } })}
              placeholder="e.g. /contact or https://..."
            />
            {!block.content.url || block.content.url.trim() === "" ? (
              <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ Button URL is required.</p>
            ) : !isValidSafeUrl(block.content.url) ? (
              <p className="text-xs text-red-600 font-medium mt-1">⚠️ Unsafe URL. Use an internal path (starting with /) or secure https:// URL.</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Variant</label>
            <SelectInput 
              value={block.content.variant || "primary"} 
              onChange={(e) => onChange({ content: { ...block.content, variant: e.target.value } })}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
            </SelectInput>
          </div>
          <PaddingControl
            content={block.content}
            onContentChange={(u) => onChange({ content: { ...block.content, ...u } })}
          />
        </>
      )}

      {block.type === "image" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Image Source</label>
            <div className="flex gap-2">
              <TextInput 
                value={block.content.url || ""} 
                onChange={(e) => onChange({ content: { ...block.content, url: e.target.value } })}
                placeholder="Image URL"
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => onOpenMediaSelector("url")}
                className="shrink-0"
              >
                Browse
              </Button>
            </div>
            {!block.content.url || block.content.url.trim() === "" ? (
              <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ Image source is required.</p>
            ) : !isValidSafeUrl(block.content.url) ? (
              <p className="text-xs text-red-600 font-medium mt-1">⚠️ Unsafe image URL. Use an internal path or secure https:// URL.</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Alt Text</label>
            <TextInput 
              value={block.content.alt || ""} 
              onChange={(e) => onChange({ content: { ...block.content, alt: e.target.value } })}
              placeholder="Describe the image for screen readers"
            />
            {(!block.content.alt || block.content.alt.trim() === "") && (
              <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ Alt text is required for accessibility.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Caption</label>
            <TextInput
              value={block.content.caption || ""}
              onChange={(e) => onChange({ content: { ...block.content, caption: e.target.value } })}
              placeholder="Optional image caption"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Resize Behavior</label>
            <SelectInput
              value={block.content.lockAspectRatio === false ? "free" : "locked"}
              onChange={(e) => onChange({ content: { ...block.content, lockAspectRatio: e.target.value !== "free", ...(e.target.value !== "free" ? { height: undefined } : {}) } })}
            >
              <option value="locked">Lock aspect ratio</option>
              <option value="free">Free resize (unlock ratio)</option>
            </SelectInput>
            <p className="text-xs text-slate-500">Drag the handles on the image in the canvas to resize it.</p>
            {(block.content.width || block.content.height) && (
              <button
                type="button"
                onClick={() => onChange({ content: { ...block.content, width: undefined, height: undefined } })}
                className="text-xs font-medium text-stonehill-accent hover:underline"
              >
                Reset to default size
              </button>
            )}
          </div>
          <CornerRadiusControl
            content={block.content}
            onContentChange={(u) => onChange({ content: { ...block.content, ...u } })}
          />
        </>
      )}

      {block.type === "spacer" && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Height</label>
          <SelectInput 
            value={block.content.height || "h-8"} 
            onChange={(e) => onChange({ content: { ...block.content, height: e.target.value } })}
          >
            <option value="h-4">Small (1rem)</option>
            <option value="h-8">Medium (2rem)</option>
            <option value="h-16">Large (4rem)</option>
            <option value="h-32">X-Large (8rem)</option>
          </SelectInput>
        </div>
      )}

      {block.type === "video" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Video Title</label>
            <TextInput 
              value={block.content.title || ""} 
              onChange={(e) => onChange({ content: { ...block.content, title: e.target.value } })}
              placeholder="e.g. Sabbath Worship Service"
            />
            {(!block.content.title || block.content.title.trim() === "") && (
              <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ Video title is recommended.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">YouTube URL</label>
            <TextInput 
              value={block.content.url || ""} 
              onChange={(e) => onChange({ content: { ...block.content, url: e.target.value } })}
              placeholder="e.g. https://www.youtube.com/watch?v=..."
            />
            {!block.content.url || block.content.url.trim() === "" ? (
              <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ YouTube URL is required.</p>
            ) : !extractYouTubeVideoId(block.content.url) ? (
              <p className="text-xs text-red-600 font-medium mt-1">⚠️ Invalid YouTube URL. Cannot extract video ID.</p>
            ) : !isValidSafeUrl(block.content.url) ? (
              <p className="text-xs text-red-600 font-medium mt-1">⚠️ Unsafe URL.</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Resize Behavior</label>
            <SelectInput
              value={block.content.lockAspectRatio === false ? "free" : "locked"}
              onChange={(e) => onChange({ content: { ...block.content, lockAspectRatio: e.target.value !== "free", ...(e.target.value !== "free" ? { height: undefined } : {}) } })}
            >
              <option value="locked">Maintain 16:9 ratio</option>
              <option value="free">Free resize (unlock ratio)</option>
            </SelectInput>
            <p className="text-xs text-slate-500">Drag the handles on the video in the canvas to resize it.</p>
            {(block.content.width || block.content.height) && (
              <button
                type="button"
                onClick={() => onChange({ content: { ...block.content, width: undefined, height: undefined } })}
                className="text-xs font-medium text-stonehill-accent hover:underline"
              >
                Reset to default size
              </button>
            )}
          </div>
          <CornerRadiusControl
            content={block.content}
            onContentChange={(u) => onChange({ content: { ...block.content, ...u } })}
          />
        </>
      )}

      {block.type === "card" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Title</label>
            <TextInput 
              value={block.content.title || ""} 
              onChange={(e) => onChange({ content: { ...block.content, title: e.target.value } })}
            />
            {(!block.content.title || block.content.title.trim() === "") && (
              <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ Card title is recommended.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Subtitle</label>
            <TextInput 
              value={block.content.subtitle || ""} 
              onChange={(e) => onChange({ content: { ...block.content, subtitle: e.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Description</label>
            <TextArea 
              value={block.content.description || block.content.text || ""} 
              onChange={(e) => onChange({ content: { ...block.content, description: e.target.value, text: e.target.value } })}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Image URL</label>
            <div className="flex gap-2">
              <TextInput 
                value={block.content.imageUrl || ""} 
                onChange={(e) => onChange({ content: { ...block.content, imageUrl: e.target.value } })}
                placeholder="Image source URL"
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => onOpenMediaSelector("imageUrl")}
                className="shrink-0"
              >
                Browse
              </Button>
            </div>
            {block.content.imageUrl && !isValidSafeUrl(block.content.imageUrl) && (
              <p className="text-xs text-red-600 font-medium mt-1">⚠️ Unsafe image URL.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Image Alt Text</label>
            <TextInput 
              value={block.content.imageAlt || ""} 
              onChange={(e) => onChange({ content: { ...block.content, imageAlt: e.target.value } })}
              placeholder="Describe card image"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Button Label</label>
            <TextInput 
              value={block.content.buttonLabel || block.content.buttonText || ""} 
              onChange={(e) => onChange({ content: { ...block.content, buttonLabel: e.target.value, buttonText: e.target.value } })}
            />
            {block.content.buttonUrl && (!block.content.buttonLabel || block.content.buttonLabel.trim() === "") && (
              <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ Button label is required if URL is set.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Button URL</label>
            <TextInput 
              value={block.content.buttonUrl || ""} 
              onChange={(e) => onChange({ content: { ...block.content, buttonUrl: e.target.value } })}
              placeholder="e.g. /learn-more"
            />
            {block.content.buttonUrl && !isValidSafeUrl(block.content.buttonUrl) && (
              <p className="text-xs text-red-600 font-medium mt-1">⚠️ Unsafe URL. Use an internal path or secure https:// URL.</p>
            )}
          </div>
        </>
      )}

      {block.type === "iconText" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Icon Name / Emoji</label>
            <TextInput 
              value={block.content.icon || ""} 
              onChange={(e) => onChange({ content: { ...block.content, icon: e.target.value } })}
              placeholder="e.g. star, user, or emoji"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Icon Image URL</label>
            <div className="flex gap-2">
              <TextInput 
                value={block.content.iconUrl || ""} 
                onChange={(e) => onChange({ content: { ...block.content, iconUrl: e.target.value } })}
                placeholder="Optional icon image URL"
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => onOpenMediaSelector("iconUrl")}
                className="shrink-0"
              >
                Browse
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Title</label>
            <TextInput 
              value={block.content.title || ""} 
              onChange={(e) => onChange({ content: { ...block.content, title: e.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Description</label>
            <TextArea 
              value={block.content.description || block.content.text || ""} 
              onChange={(e) => onChange({ content: { ...block.content, description: e.target.value, text: e.target.value } })}
              rows={3}
            />
          </div>
        </>
      )}

      {block.type === "cta" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Title</label>
            <TextInput 
              value={block.content.title || ""} 
              onChange={(e) => onChange({ content: { ...block.content, title: e.target.value } })}
            />
            {(!block.content.title || block.content.title.trim() === "") && (
              <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ CTA title is recommended.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Description Text</label>
            <TextArea 
              value={block.content.text || ""} 
              onChange={(e) => onChange({ content: { ...block.content, text: e.target.value } })}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Button Label</label>
            <TextInput 
              value={block.content.buttonLabel || block.content.buttonText || ""} 
              onChange={(e) => onChange({ content: { ...block.content, buttonLabel: e.target.value, buttonText: e.target.value } })}
            />
            {block.content.buttonUrl && (!block.content.buttonLabel || block.content.buttonLabel.trim() === "") && (
              <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ Button label is required if URL is set.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Button URL</label>
            <TextInput 
              value={block.content.buttonUrl || ""} 
              onChange={(e) => onChange({ content: { ...block.content, buttonUrl: e.target.value } })}
              placeholder="e.g. /join-us"
            />
            {block.content.buttonUrl && !isValidSafeUrl(block.content.buttonUrl) && (
              <p className="text-xs text-red-600 font-medium mt-1">⚠️ Unsafe URL. Use an internal path or secure https:// URL.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Background Style</label>
            <SelectInput 
              value={block.content.background || block.content.backgroundStyle || "primary"} 
              onChange={(e) => onChange({ content: { ...block.content, background: e.target.value, backgroundStyle: e.target.value } })}
            >
              <option value="primary">Stonehill Navy (Primary)</option>
              <option value="accent">Stonehill Gold (Accent)</option>
              <option value="light">Stonehill Cream (Light)</option>
            </SelectInput>
          </div>
        </>
      )}

      {block.type === "divider" && (
        <div className="text-sm text-slate-500 py-4 text-center border-t border-slate-100 font-sans">
          Divider block has no content configuration.
        </div>
      )}
    </>
  );
}

/** Per-corner border-radius controls for image/video blocks. */
function CornerRadiusControl({
  content,
  onContentChange,
}: {
  content: Record<string, any>;
  onContentChange: (updates: Record<string, unknown>) => void;
}) {
  const cr = content.cornerRadius || {};
  const linked = content.cornerLinked !== false;
  const cornerVal = (key: "tl" | "tr" | "br" | "bl") =>
    typeof cr[key] === "string" ? cr[key] : "0";

  const setCorner = (key: "tl" | "tr" | "br" | "bl", value: string) => {
    if (linked) {
      onContentChange({ cornerRadius: { tl: value, tr: value, br: value, bl: value } });
    } else {
      onContentChange({
        cornerRadius: {
          tl: cornerVal("tl"),
          tr: cornerVal("tr"),
          br: cornerVal("br"),
          bl: cornerVal("bl"),
          [key]: value,
        },
      });
    }
  };

  const toggleLinked = (next: boolean) => {
    if (next) {
      const v = cornerVal("tl");
      onContentChange({ cornerLinked: true, cornerRadius: { tl: v, tr: v, br: v, bl: v } });
    } else {
      onContentChange({ cornerLinked: false });
    }
  };

  const reset = () =>
    onContentChange({ cornerRadius: { tl: "0", tr: "0", br: "0", bl: "0" } });

  const cornerField = (key: "tl" | "tr" | "br" | "bl", labelText: string) => (
    <div className="space-y-1">
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{labelText}</span>
      <TextInput value={cornerVal(key)} onChange={(e) => setCorner(key, e.target.value)} placeholder="0" />
    </div>
  );

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Corner Radius</label>
      <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <input
          type="checkbox"
          checked={linked}
          onChange={(e) => toggleLinked(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
        />
        Link all corners
      </label>
      {linked ? (
        <TextInput
          value={cornerVal("tl")}
          onChange={(e) => setCorner("tl", e.target.value)}
          placeholder="e.g. 12px, 10%, 50%"
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {cornerField("tl", "Top Left")}
          {cornerField("tr", "Top Right")}
          {cornerField("bl", "Bottom Left")}
          {cornerField("br", "Bottom Right")}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">px or %. 50% on all = circle.</p>
        <button type="button" onClick={reset} className="text-xs font-medium text-stonehill-accent hover:underline">
          Reset
        </button>
      </div>
    </div>
  );
}

function PaddingControl({
  content,
  onContentChange,
}: {
  content: Record<string, any>;
  onContentChange: (updates: Record<string, unknown>) => void;
}) {
  const pad = content.padding || {};
  const linked = content.paddingLinked !== false;

  const defaultPadding = {
    top: "8px",
    right: "16px",
    bottom: "8px",
    left: "16px",
  };

  const getPadVal = (key: "top" | "right" | "bottom" | "left") => {
    return typeof pad[key] === "string" ? pad[key] : defaultPadding[key];
  };

  const setPad = (key: "top" | "right" | "bottom" | "left", value: string) => {
    let cleanVal = value;
    
    if (linked) {
      onContentChange({
        padding: {
          top: cleanVal,
          right: cleanVal,
          bottom: cleanVal,
          left: cleanVal,
        },
      });
    } else {
      onContentChange({
        padding: {
          top: getPadVal("top"),
          right: getPadVal("right"),
          bottom: getPadVal("bottom"),
          left: getPadVal("left"),
          [key]: cleanVal,
        },
      });
    }
  };

  const toggleLinked = (next: boolean) => {
    if (next) {
      const v = getPadVal("top");
      onContentChange({
        paddingLinked: true,
        padding: { top: v, right: v, bottom: v, left: v },
      });
    } else {
      onContentChange({ paddingLinked: false });
    }
  };

  const reset = () => {
    onContentChange({
      paddingLinked: false,
      padding: { ...defaultPadding },
    });
  };

  const paddingField = (key: "top" | "right" | "bottom" | "left", labelText: string) => (
    <div className="space-y-1">
      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{labelText}</span>
      <TextInput
        value={pad[key] ?? ""}
        placeholder={defaultPadding[key]}
        onChange={(e) => setPad(key, e.target.value)}
        onBlur={() => {
          if (!pad[key] || pad[key].trim() === "") {
            setPad(key, defaultPadding[key]);
          }
        }}
      />
    </div>
  );

  return (
    <div className="space-y-2 border-t border-slate-100 pt-4">
      <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Label Padding</label>
      <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <input
          type="checkbox"
          checked={linked}
          onChange={(e) => toggleLinked(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
        />
        Link padding
      </label>
      {linked ? (
        <TextInput
          value={pad.top ?? ""}
          placeholder="e.g. 8px"
          onChange={(e) => setPad("top", e.target.value)}
          onBlur={() => {
            if (!pad.top || pad.top.trim() === "") {
              onContentChange({
                padding: { top: "8px", right: "8px", bottom: "8px", left: "8px" },
              });
            }
          }}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {paddingField("top", "Top")}
          {paddingField("right", "Right")}
          {paddingField("bottom", "Bottom")}
          {paddingField("left", "Left")}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">Specify px or % values.</p>
        <button type="button" onClick={reset} className="text-xs font-medium text-stonehill-accent hover:underline">
          Reset to Default
        </button>
      </div>
    </div>
  );
}

