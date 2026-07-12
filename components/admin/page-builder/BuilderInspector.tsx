import * as React from "react";
import { Settings } from "lucide-react";
import { SelectInput } from "@/components/forms/SelectInput";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { Button } from "@/components/shared/Button";
import { BackgroundPanel } from "./BackgroundPanel";
import { InspectorLabel } from "./InspectorLabel";
import { MarginControl, PaddingControlV2 } from "./SpacingControl";
import { usePageBuilder } from "./PageBuilderContext";
import { PageBlock, PageBuilderRow, PageBuilderSection, PageColumn } from "@/types/pageBuilder";
import { MediaSelectorDialog } from "@/components/admin/media/MediaSelectorDialog";
import { isValidSafeUrl, isValidGoogleMapsEmbedUrl } from "@/lib/pageBuilderSafety";
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
    handleUpdateColumn,
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
  let selectedColumn: PageColumn | undefined;
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
        if (col.id === selectedElementId) {
          selectedSection = section;
          selectedColumn = col;
          selectedColumnId = col.id;
          break outer;
        }
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
          if (col.id === selectedElementId) {
            selectedSection = section;
            selectedRow = row;
            selectedColumn = col;
            selectedColumnId = col.id;
            break outer;
          }
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
      // Sentinel "images[]" appends to the gallery/carousel images array
      // instead of setting a single field.
      if (field === "images[]") {
        const current = Array.isArray(selectedBlock.content?.images) ? selectedBlock.content.images : [];
        handleUpdateBlock(sectionId, blockId, {
          content: { ...selectedBlock.content, images: [...current, { url, alt: "", caption: "" }] },
        }, columnId);
        return;
      }
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
          {selectedBlock
            ? "Block Settings"
            : selectedColumn
              ? "Column Settings"
              : selectedRow
                ? "Row Settings"
                : "Section Settings"}
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
        ) : selectedColumn ? (
          <ColumnInspector
            column={selectedColumn}
            onChange={(updates) =>
              handleUpdateColumn(
                selectedSection!.id,
                selectedColumn!.id,
                updates,
                selectedRow?.id,
              )
            }
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
          <InspectorLabel tooltip="How this section's content is split horizontally. Mobile stacks every column.">Layout Structure</InspectorLabel>
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
          <InspectorLabel tooltip="How columns of different heights line up vertically. Stretch makes them equal height.">Column Vertical Alignment</InspectorLabel>
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
        <InspectorLabel tooltip="Boxed keeps content inside the page's max width. Full Width breaks out to span the entire viewport (useful for hero strips and image bands).">Content Width</InspectorLabel>
        <SelectInput
          value={section.style?.layoutWidth || "content"}
          onChange={(e) => onChange({ style: { ...section.style, layoutWidth: e.target.value as any } })}
        >
          <option value="content">Boxed (Content Width)</option>
          <option value="full">Full Width</option>
        </SelectInput>
      </div>

      <PaddingControlV2
        desktop={section.style?.paddingValues}
        tablet={section.style?.paddingValuesTablet}
        mobile={section.style?.paddingValuesMobile}
        onChange={(device, next) =>
          onChange({
            style: {
              ...section.style,
              ...(device === "desktop"
                ? { paddingValues: next }
                : device === "tablet"
                  ? { paddingValuesTablet: next }
                  : { paddingValuesMobile: next }),
            },
          })
        }
        tooltip="Per-side padding for the section. Switch the device tabs to set tablet/mobile overrides — they inherit from desktop until you set them."
      />

      <MarginControl
        desktop={section.style?.marginValues}
        tablet={section.style?.marginValuesTablet}
        mobile={section.style?.marginValuesMobile}
        onChange={(device, next) =>
          onChange({
            style: {
              ...section.style,
              ...(device === "desktop"
                ? { marginValues: next }
                : device === "tablet"
                  ? { marginValuesTablet: next }
                  : { marginValuesMobile: next }),
            },
          })
        }
        tooltip="Per-side margin for the section (negative values allowed). Tablet/mobile inherit from desktop until overridden."
      />

      <BackgroundPanel
        value={section.style}
        onChange={(nextStyle) => onChange({ style: nextStyle })}
      />
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
        <InspectorLabel tooltip="How this row's columns are split. Mobile always stacks them into a single column.">Row Layout</InspectorLabel>
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
          <InspectorLabel tooltip="How columns of different heights line up vertically. Stretch makes them equal height.">Column Vertical Alignment</InspectorLabel>
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

      <PaddingControlV2
        desktop={row.style?.paddingValues}
        tablet={row.style?.paddingValuesTablet}
        mobile={row.style?.paddingValuesMobile}
        onChange={(device, next) =>
          onChange({
            style: {
              ...row.style,
              ...(device === "desktop"
                ? { paddingValues: next }
                : device === "tablet"
                  ? { paddingValuesTablet: next }
                  : { paddingValuesMobile: next }),
            },
          })
        }
        tooltip="Per-side padding. Switch the device tabs to set tablet/mobile overrides — they inherit from desktop until you set them."
      />

      <MarginControl
        desktop={row.style?.marginValues}
        tablet={row.style?.marginValuesTablet}
        mobile={row.style?.marginValuesMobile}
        onChange={(device, next) =>
          onChange({
            style: {
              ...row.style,
              ...(device === "desktop"
                ? { marginValues: next }
                : device === "tablet"
                  ? { marginValuesTablet: next }
                  : { marginValuesMobile: next }),
            },
          })
        }
        tooltip="Per-side margin (negative values allowed). Tablet/mobile inherit from desktop until overridden."
      />

      <BackgroundPanel
        value={row.style}
        onChange={(nextStyle) => onChange({ style: nextStyle })}
      />
    </>
  );
}

function ColumnInspector({
  column,
  onChange,
}: {
  column: PageColumn;
  onChange: (updates: Partial<PageColumn>) => void;
}) {
  return (
    <>
      <PaddingControlV2
        desktop={column.style?.paddingValues}
        tablet={column.style?.paddingValuesTablet}
        mobile={column.style?.paddingValuesMobile}
        onChange={(device, next) =>
          onChange({
            style: {
              ...column.style,
              ...(device === "desktop"
                ? { paddingValues: next }
                : device === "tablet"
                  ? { paddingValuesTablet: next }
                  : { paddingValuesMobile: next }),
            },
          })
        }
        tooltip="Per-side padding for this column. Switch the device tabs to set tablet/mobile overrides."
      />

      <MarginControl
        desktop={column.style?.marginValues}
        tablet={column.style?.marginValuesTablet}
        mobile={column.style?.marginValuesMobile}
        onChange={(device, next) =>
          onChange({
            style: {
              ...column.style,
              ...(device === "desktop"
                ? { marginValues: next }
                : device === "tablet"
                  ? { marginValuesTablet: next }
                  : { marginValuesMobile: next }),
            },
          })
        }
        tooltip="Per-side margin for this column (negative values allowed)."
      />

      <div className="space-y-1.5">
        <InspectorLabel tooltip="Alignment of the elements and text inside the column.">Content Horizontal Alignment</InspectorLabel>
        <SelectInput
          value={column.style?.textAlign || "left"}
          onChange={(e) => onChange({ style: { ...column.style, textAlign: e.target.value as any } })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </SelectInput>
      </div>

      <BackgroundPanel
        value={column.style}
        onChange={(nextStyle) => onChange({ style: nextStyle })}
      />
    </>
  );
}

function BlockInspector({
  sectionId,
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
              <option value="h5">H5</option>
              <option value="h6">H6</option>
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
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <input
              type="checkbox"
              checked={!!block.content.openInNewTab}
              onChange={(e) => onChange({ content: { ...block.content, openInNewTab: e.target.checked } })}
              className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
            />
            Open in new tab
          </label>
          <ButtonPaddingControl
            content={block.content}
            onContentChange={(u) => onChange({ content: { ...block.content, ...u } })}
          />
        </>
      )}

      {block.type === "image" && (
        <>
          <div className="space-y-1.5">
            <InspectorLabel tooltip="Paste a URL (https://...) or click Browse to pick from the Media library. Internal paths like /images/foo.jpg also work.">Image Source</InspectorLabel>
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
            <InspectorLabel tooltip="Locked keeps the original proportions when you drag the corner handle. Free lets you set width and height independently (may stretch the image).">Resize Behavior</InspectorLabel>
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
            <InspectorLabel tooltip="Locked keeps the original proportions when you drag the corner handle. Free lets you set width and height independently (may stretch the image).">Resize Behavior</InspectorLabel>
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

      {block.type === "iconBox" && (
        <>
          <div className="space-y-1.5">
            <InspectorLabel tooltip="Switch between a simple icon/emoji and a full image at the top of the box. Image mode exposes size, border, and shadow controls below.">Top Element</InspectorLabel>
            <SelectInput
              value={block.content.variant || "icon"}
              onChange={(e) => onChange({ content: { ...block.content, variant: e.target.value } })}
            >
              <option value="icon">Icon / Emoji</option>
              <option value="image">Image</option>
            </SelectInput>
          </div>

          {block.content.variant === "image" ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Image</label>
                <div className="flex gap-2">
                  <TextInput
                    value={block.content.iconUrl || ""}
                    onChange={(e) => onChange({ content: { ...block.content, iconUrl: e.target.value } })}
                    placeholder="Image URL"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenMediaSelector("iconUrl")} className="shrink-0">
                    Browse
                  </Button>
                </div>
                {block.content.iconUrl && !isValidSafeUrl(block.content.iconUrl) && (
                  <p className="text-xs text-red-600 font-medium mt-1">⚠️ Unsafe image URL.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Alt Text</label>
                <TextInput
                  value={block.content.alt || ""}
                  onChange={(e) => onChange({ content: { ...block.content, alt: e.target.value } })}
                  placeholder="Describe the image for screen readers"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Icon (emoji or text)</label>
                <TextInput
                  value={block.content.icon || ""}
                  onChange={(e) => onChange({ content: { ...block.content, icon: e.target.value } })}
                  placeholder="e.g. ⭐ or A"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Icon Image (optional)</label>
                <div className="flex gap-2">
                  <TextInput
                    value={block.content.iconUrl || ""}
                    onChange={(e) => onChange({ content: { ...block.content, iconUrl: e.target.value } })}
                    placeholder="Icon image URL"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenMediaSelector("iconUrl")} className="shrink-0">
                    Browse
                  </Button>
                </div>
                <p className="text-xs text-slate-500">If set, the image overrides the emoji.</p>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Title</label>
            <TextInput
              value={block.content.title || ""}
              onChange={(e) => onChange({ content: { ...block.content, title: e.target.value } })}
            />
          </div>
          <div className="space-y-1.5">
            <InspectorLabel tooltip="Heading level (H1–H6). H1 is largest; use it once per page for SEO. H3 is a safe default for cards inside other content.">Title Level</InspectorLabel>
            <SelectInput
              value={block.content.level || "h3"}
              onChange={(e) => onChange({ content: { ...block.content, level: e.target.value } })}
            >
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
              <option value="h4">H4</option>
              <option value="h5">H5</option>
              <option value="h6">H6</option>
            </SelectInput>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Description</label>
            <TextArea
              value={block.content.description || ""}
              onChange={(e) => onChange({ content: { ...block.content, description: e.target.value } })}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Alignment</label>
            <SelectInput
              value={block.content.alignment || "center"}
              onChange={(e) => onChange({ content: { ...block.content, alignment: e.target.value } })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </SelectInput>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Link URL (optional)</label>
            <TextInput
              value={block.content.url || ""}
              onChange={(e) => onChange({ content: { ...block.content, url: e.target.value } })}
              placeholder="e.g. /ministries or https://..."
            />
            {block.content.url && !isValidSafeUrl(block.content.url) && (
              <p className="text-xs text-red-600 font-medium mt-1">⚠️ Unsafe URL. Use an internal path or secure https:// URL.</p>
            )}
            {block.content.url && (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600 mt-2">
                <input
                  type="checkbox"
                  checked={!!block.content.openInNewTab}
                  onChange={(e) => onChange({ content: { ...block.content, openInNewTab: e.target.checked } })}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
                />
                Open in new tab
              </label>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Image Styling</h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Width</span>
                <TextInput
                  value={block.content.imageWidth || ""}
                  onChange={(e) => onChange({ content: { ...block.content, imageWidth: e.target.value } })}
                  placeholder="e.g. 200px, 50%"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Height</span>
                <TextInput
                  value={block.content.lockAspectRatio === true ? "auto" : (block.content.imageHeight || "")}
                  onChange={(e) => onChange({ content: { ...block.content, imageHeight: e.target.value } })}
                  placeholder="e.g. 200px"
                  disabled={block.content.lockAspectRatio === true}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={block.content.lockAspectRatio === true}
                onChange={(e) => onChange({
                  content: {
                    ...block.content,
                    lockAspectRatio: e.target.checked,
                    // Clear an explicit height when locking; height becomes auto.
                    ...(e.target.checked ? { imageHeight: undefined } : {}),
                  },
                })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
              />
              Maintain aspect ratio (lock height to image's natural ratio)
            </label>

            <div className="space-y-1.5">
              <InspectorLabel popover="How the image fills its box when its proportions don't match.\n\n• Cover — fills the box, crops the overflow (most common)\n• Contain — fits entirely inside, may leave empty space\n• Fill — stretches to fill exactly (can distort)\n• None — original size\n• Scale-down — smaller of None or Contain">Object Fit</InspectorLabel>
              <SelectInput
                value={block.content.objectFit || "cover"}
                onChange={(e) => onChange({ content: { ...block.content, objectFit: e.target.value } })}
                disabled={block.content.lockAspectRatio === true}
              >
                <option value="cover">Cover — crop to fill</option>
                <option value="contain">Contain — fit entirely</option>
                <option value="fill">Fill — stretch</option>
                <option value="scale-down">Scale down</option>
              </SelectInput>
              <p className="text-xs text-slate-500">Only applies when aspect ratio is unlocked.</p>
            </div>

            <CornerRadiusControl
              content={block.content}
              onContentChange={(u) => onChange({ content: { ...block.content, ...u } })}
            />

            <div className="space-y-1.5">
              <InspectorLabel tooltip="Drop shadow beneath the image. Subtle shadows add depth; large shadows draw the eye.">Shadow</InspectorLabel>
              <SelectInput
                value={block.content.shadowSize || "none"}
                onChange={(e) => onChange({ content: { ...block.content, shadowSize: e.target.value } })}
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </SelectInput>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={!!block.content.border}
                  onChange={(e) => onChange({ content: { ...block.content, border: e.target.checked } })}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
                />
                Show border
              </label>
              {block.content.border && (
                <>
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Border Color</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "#e7ab10", label: "Gold (Accent)" },
                        { value: "#1e3f66", label: "Navy (Primary)" },
                        { value: "#1c6b8d", label: "Blue (Secondary)" },
                        { value: "#8eb5c7", label: "Light Blue" },
                        { value: "#fbfaf6", label: "Cream" },
                        { value: "#ffffff", label: "White" },
                        { value: "#17201d", label: "Dark" },
                      ].map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-7 h-7 rounded border transition-all ${
                            (block.content.borderColor || "#e7ab10") === color.value
                              ? "border-stonehill-accent ring-2 ring-stonehill-accent ring-offset-1 scale-110"
                              : "border-slate-200 hover:scale-105"
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => onChange({ content: { ...block.content, borderColor: color.value } })}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Border Width (px)</span>
                    <TextInput
                      type="number"
                      value={typeof block.content.borderWidth === "number" ? String(block.content.borderWidth) : ""}
                      onChange={(e) => onChange({
                        content: {
                          ...block.content,
                          borderWidth: e.target.value === "" ? undefined : Math.max(0, Math.min(20, Number(e.target.value))),
                        },
                      })}
                      placeholder="2"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {block.type === "googleMap" && (
        <>
          <div className="space-y-1.5">
            <InspectorLabel popover="Paste the `src` from Google Maps' Share → Embed a map → iframe code. The URL must start with `https://www.google.com/maps/embed?` — any other URL is rejected for safety.">Embed URL</InspectorLabel>
            <TextArea
              value={block.content.embedUrl || ""}
              onChange={(e) => onChange({ content: { ...block.content, embedUrl: e.target.value } })}
              placeholder="https://www.google.com/maps/embed?pb=..."
              rows={3}
            />
            {!block.content.embedUrl ? (
              <p className="text-xs text-yellow-600 font-medium mt-1">⚠️ Embed URL is required.</p>
            ) : !isValidGoogleMapsEmbedUrl(block.content.embedUrl) ? (
              <p className="text-xs text-red-600 font-medium mt-1">⚠️ Must be a Google Maps embed URL (https://www.google.com/maps/embed?...).</p>
            ) : null}
            <p className="text-xs text-slate-500">
              In Google Maps: Share → Embed a map → Copy HTML and paste the value of the <code>src=&quot;…&quot;</code> attribute here.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Height (px)</label>
            <TextInput
              type="number"
              value={typeof block.content.height === "number" ? String(block.content.height) : ""}
              onChange={(e) => onChange({ content: { ...block.content, height: e.target.value === "" ? undefined : Math.max(150, Math.min(1200, Number(e.target.value))) } })}
              placeholder="400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={!!block.content.fullWidth}
                onChange={(e) => onChange({ content: { ...block.content, fullWidth: e.target.checked } })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
              />
              Full width (break out of the centered content container)
            </label>
          </div>
        </>
      )}

      {block.type === "gallery" && (() => {
        const images: Array<{ url?: string; alt?: string; caption?: string }> = Array.isArray(block.content.images) ? block.content.images : [];
        const setImages = (next: typeof images) => onChange({ content: { ...block.content, images: next } });
        const updateImage = (idx: number, updates: Partial<{ url: string; alt: string; caption: string }>) => {
          const next = images.map((img, i) => (i === idx ? { ...img, ...updates } : img));
          setImages(next);
        };
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Images ({images.length})</label>
              <div className="space-y-2">
                {images.map((img, i) => (
                  <div key={i} className="flex gap-2 p-2 border border-slate-200 rounded-md bg-slate-50">
                    <div className="w-12 h-12 shrink-0 bg-slate-200 rounded overflow-hidden flex items-center justify-center">
                      {img.url ? (
                        <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-slate-400">No URL</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <TextInput
                        value={img.alt || ""}
                        onChange={(e) => updateImage(i, { alt: e.target.value })}
                        placeholder="Alt text"
                      />
                      <TextInput
                        value={img.caption || ""}
                        onChange={(e) => updateImage(i, { caption: e.target.value })}
                        placeholder="Caption (optional)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, j) => j !== i))}
                      className="self-start text-xs text-red-600 hover:underline"
                      title="Remove image"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenMediaSelector("images[]")}>
                + Add image
              </Button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Columns</label>
              <SelectInput
                value={String(block.content.columns || 3)}
                onChange={(e) => onChange({ content: { ...block.content, columns: Number(e.target.value) } })}
              >
                <option value="2">2 columns</option>
                <option value="3">3 columns</option>
                <option value="4">4 columns</option>
              </SelectInput>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Spacing (gutter)</label>
              <SelectInput
                value={block.content.gutter || "md"}
                onChange={(e) => onChange({ content: { ...block.content, gutter: e.target.value } })}
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </SelectInput>
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={block.content.rounded !== false}
                onChange={(e) => onChange({ content: { ...block.content, rounded: e.target.checked } })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
              />
              Rounded corners
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={!!block.content.lightbox}
                onChange={(e) => onChange({ content: { ...block.content, lightbox: e.target.checked } })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
              />
              Open full-size image in lightbox on click
            </label>
          </>
        );
      })()}

      {block.type === "carousel" && (() => {
        const images: Array<{ url?: string; alt?: string }> = Array.isArray(block.content.images) ? block.content.images : [];
        const setImages = (next: typeof images) => onChange({ content: { ...block.content, images: next } });
        const updateImage = (idx: number, updates: Partial<{ url: string; alt: string }>) => {
          setImages(images.map((img, i) => (i === idx ? { ...img, ...updates } : img)));
        };
        return (
          <>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Slides ({images.length})</label>
              <div className="space-y-2">
                {images.map((img, i) => (
                  <div key={i} className="flex gap-2 p-2 border border-slate-200 rounded-md bg-slate-50">
                    <div className="w-12 h-12 shrink-0 bg-slate-200 rounded overflow-hidden">
                      {img.url ? (
                        <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <TextInput
                      value={img.alt || ""}
                      onChange={(e) => updateImage(i, { alt: e.target.value })}
                      placeholder="Alt text"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, j) => j !== i))}
                      className="self-start text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenMediaSelector("images[]")}>
                + Add slide
              </Button>
            </div>

            <div className="space-y-1.5">
              <InspectorLabel tooltip="How one slide gives way to the next. Fade is gentlest; Slide pushes the previous image off-screen.">Transition</InspectorLabel>
              <SelectInput
                value={block.content.transition || "slide"}
                onChange={(e) => onChange({ content: { ...block.content, transition: e.target.value } })}
              >
                <option value="slide">Slide</option>
                <option value="fade">Fade</option>
              </SelectInput>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Height (px)</label>
              <TextInput
                type="number"
                value={typeof block.content.height === "number" ? String(block.content.height) : ""}
                onChange={(e) => onChange({ content: { ...block.content, height: e.target.value === "" ? undefined : Math.max(160, Math.min(800, Number(e.target.value))) } })}
                placeholder="480"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={block.content.autoplay !== false}
                onChange={(e) => onChange({ content: { ...block.content, autoplay: e.target.checked } })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
              />
              Autoplay
            </label>
            {block.content.autoplay !== false && (
              <div className="space-y-1.5 ml-6">
                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Autoplay speed (ms)</label>
                <TextInput
                  type="number"
                  value={typeof block.content.autoplaySpeedMs === "number" ? String(block.content.autoplaySpeedMs) : ""}
                  onChange={(e) => onChange({ content: { ...block.content, autoplaySpeedMs: e.target.value === "" ? undefined : Math.max(1000, Math.min(20000, Number(e.target.value))) } })}
                  placeholder="5000"
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={block.content.showArrows !== false}
                onChange={(e) => onChange({ content: { ...block.content, showArrows: e.target.checked } })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
              />
              Show navigation arrows
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={block.content.showDots !== false}
                onChange={(e) => onChange({ content: { ...block.content, showDots: e.target.checked } })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
              />
              Show pagination dots
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={block.content.rounded !== false}
                onChange={(e) => onChange({ content: { ...block.content, rounded: e.target.checked } })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
              />
              Rounded corners
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={!!block.content.shadow}
                onChange={(e) => onChange({ content: { ...block.content, shadow: e.target.checked } })}
                className="h-3.5 w-3.5 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
              />
              Drop shadow
            </label>
          </>
        );
      })()}

      {block.type === "countdown" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Target date &amp; time</label>
            <TextInput
              type="datetime-local"
              value={(() => {
                const v = block.content.targetDateTime;
                if (!v) return "";
                const d = new Date(v);
                if (isNaN(d.getTime())) return "";
                // datetime-local expects YYYY-MM-DDTHH:mm (local)
                const pad = (n: number) => String(n).padStart(2, "0");
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
              })()}
              onChange={(e) => onChange({ content: { ...block.content, targetDateTime: e.target.value ? new Date(e.target.value).toISOString() : undefined } })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Label (optional)</label>
            <TextInput
              value={block.content.label || ""}
              onChange={(e) => onChange({ content: { ...block.content, label: e.target.value } })}
              placeholder="Event starts in"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Style</label>
            <SelectInput
              value={block.content.style || "boxed"}
              onChange={(e) => onChange({ content: { ...block.content, style: e.target.value } })}
            >
              <option value="boxed">Boxed (day / hr / min / sec cards)</option>
              <option value="inline">Inline (single line)</option>
            </SelectInput>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Alignment</label>
            <SelectInput
              value={block.content.alignment || "center"}
              onChange={(e) => onChange({ content: { ...block.content, alignment: e.target.value } })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </SelectInput>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Accent Color</span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "#e7ab10", label: "Gold (Accent)" },
                { value: "#1e3f66", label: "Navy (Primary)" },
                { value: "#1c6b8d", label: "Blue (Secondary)" },
                { value: "#17201d", label: "Dark" },
              ].map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-7 h-7 rounded border transition-all ${
                    (block.content.accentColor || "#e7ab10") === color.value
                      ? "border-stonehill-accent ring-2 ring-stonehill-accent ring-offset-1 scale-110"
                      : "border-slate-200 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => onChange({ content: { ...block.content, accentColor: color.value } })}
                  title={color.label}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {block.type === "cta" && (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Subheading (optional)</label>
            <TextInput
              value={block.content.subheading || ""}
              onChange={(e) => onChange({ content: { ...block.content, subheading: e.target.value } })}
              placeholder="e.g. Don't miss it"
            />
          </div>
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
            <InspectorLabel tooltip="Color theme for the CTA. Light uses the soft brand background; the others use brand-dark or accent colors with white text. Overridden if you set a Background Image below.">Background Style</InspectorLabel>
            <SelectInput 
              value={block.content.background || block.content.backgroundStyle || "primary"} 
              onChange={(e) => onChange({ content: { ...block.content, background: e.target.value, backgroundStyle: e.target.value } })}
            >
              <option value="primary">Stonehill Navy (Primary)</option>
              <option value="accent">Stonehill Gold (Accent)</option>
              <option value="light">Stonehill Cream (Light)</option>
            </SelectInput>
          </div>
          <div className="space-y-1.5">
            <InspectorLabel tooltip="Optional photo behind the CTA. A dark overlay is added automatically so light text stays readable.">Background Image (optional)</InspectorLabel>
            <div className="flex gap-2">
              <TextInput
                value={block.content.backgroundImage || ""}
                onChange={(e) => onChange({ content: { ...block.content, backgroundImage: e.target.value } })}
                placeholder="Image URL"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenMediaSelector("backgroundImage")} className="shrink-0">
                Browse
              </Button>
            </div>
            {block.content.backgroundImage && !isValidSafeUrl(block.content.backgroundImage) && (
              <p className="text-xs text-red-600 font-medium mt-1">⚠️ Unsafe URL.</p>
            )}
            {block.content.backgroundImage && (
              <p className="text-xs text-slate-500">A dark overlay is added automatically so text stays readable.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Padding</label>
            <SelectInput
              value={block.content.padding || "medium"}
              onChange={(e) => onChange({ content: { ...block.content, padding: e.target.value } })}
            >
              <option value="small">Small</option>
              <option value="medium">Medium (default)</option>
              <option value="large">Large</option>
            </SelectInput>
          </div>
        </>
      )}

      {block.type === "row" && (() => {
        const { handleAddNestedColumn, handleRemoveNestedColumn } = usePageBuilder();
        const cols = block.content.columns || [];
        const responsive = block.content.responsive || { desktop: "horizontal", tablet: "auto", mobile: "stacked" };
        
        return (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Columns ({cols.length})</label>
                <button
                  type="button"
                  onClick={() => handleAddNestedColumn(sectionId, block.id)}
                  disabled={cols.length >= 4}
                  className="px-2 py-1 text-xs font-semibold bg-stonehill-accent hover:bg-stonehill-accent/90 text-white rounded transition-colors disabled:opacity-50"
                >
                  + Add Column
                </button>
              </div>

              {cols.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No columns in this row.</p>
              ) : (
                <div className="space-y-3">
                  {cols.map((col: any, colIdx: number) => (
                    <div key={col.id || colIdx} className="p-2 border border-slate-200 rounded-md bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Column {colIdx + 1}</span>
                        {cols.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveNestedColumn(sectionId, block.id, col.id)}
                            className="text-xs text-red-655 hover:underline text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Width</span>
                        <TextInput
                          value={col.width || ""}
                          onChange={(e) => {
                            const nextCols = cols.map((c: any) =>
                              c.id === col.id ? { ...c, width: e.target.value } : c
                            );
                            onChange({
                              content: {
                                ...block.content,
                                columns: nextCols,
                              }
                            });
                          }}
                          placeholder="e.g. 50%"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const nextCols = cols.map((c: any) => ({ ...c, width: `${100 / cols.length}%` }));
                      onChange({
                        content: {
                          ...block.content,
                          columns: nextCols,
                        }
                      });
                    }}
                    className="text-xs font-semibold text-stonehill-accent hover:underline"
                  >
                    Equalize column widths
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Responsive Layout Options</h4>

              <div className="space-y-1.5">
                <InspectorLabel tooltip="Layout direction on large screens (desktop).">Desktop</InspectorLabel>
                <SelectInput
                  value={responsive.desktop || "horizontal"}
                  onChange={(e) => onChange({
                    content: {
                      ...block.content,
                      responsive: {
                        ...responsive,
                        desktop: e.target.value
                      }
                    }
                  })}
                >
                  <option value="horizontal">Side by Side (Horizontal)</option>
                  <option value="stacked">Stacked (Vertical)</option>
                </SelectInput>
              </div>

              <div className="space-y-1.5">
                <InspectorLabel tooltip="Layout direction on medium screens (tablet). Auto inherits from desktop.">Tablet</InspectorLabel>
                <SelectInput
                  value={responsive.tablet || "auto"}
                  onChange={(e) => onChange({
                    content: {
                      ...block.content,
                      responsive: {
                        ...responsive,
                        tablet: e.target.value
                      }
                    }
                  })}
                >
                  <option value="auto">Auto (Responsive)</option>
                  <option value="horizontal">Side by Side (Horizontal)</option>
                  <option value="stacked">Stacked (Vertical)</option>
                </SelectInput>
              </div>

              <div className="space-y-1.5">
                <InspectorLabel tooltip="Layout direction on small screens (mobile). Stacked is recommended.">Mobile</InspectorLabel>
                <SelectInput
                  value={responsive.mobile || "stacked"}
                  onChange={(e) => onChange({
                    content: {
                      ...block.content,
                      responsive: {
                        ...responsive,
                        mobile: e.target.value
                      }
                    }
                  })}
                >
                  <option value="stacked">Stacked (Vertical)</option>
                  <option value="horizontal">Side by Side (Horizontal)</option>
                </SelectInput>
              </div>

              <div className="space-y-1.5 border-t border-slate-100 pt-3 mt-3">
                <InspectorLabel tooltip="How columns of different heights line up vertically. Stretch makes them equal height.">Column Vertical Alignment</InspectorLabel>
                <SelectInput
                  value={block.style?.alignItems || "start"}
                  onChange={(e) => onChange({
                    style: {
                      ...block.style,
                      alignItems: e.target.value as any
                    }
                  })}
                >
                  <option value="start">Top — auto height (recommended)</option>
                  <option value="stretch">Stretch — equal height</option>
                  <option value="center">Center</option>
                  <option value="end">Bottom</option>
                </SelectInput>
              </div>
            </div>
          </>
        );
      })()}

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
      <InspectorLabel tooltip="Rounds the corners. With Link all corners on, one value applies to all four; turn it off to set each corner separately. Use 50% on a square image for a perfect circle.">Corner Radius</InspectorLabel>
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

function ButtonPaddingControl({
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
      <InspectorLabel tooltip="Space inside the button between the text and its edges. Link all sides keeps top/bottom and left/right balanced.">Label Padding</InspectorLabel>
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

