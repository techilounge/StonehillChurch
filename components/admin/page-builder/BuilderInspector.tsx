import * as React from "react";
import { Settings } from "lucide-react";
import { SelectInput } from "@/components/forms/SelectInput";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { Button } from "@/components/shared/Button";
import { usePageBuilder } from "./PageBuilderContext";
import { PageBuilderSection, PageBlock } from "@/types/pageBuilder";
import { MediaSelectorDialog } from "@/components/admin/media/MediaSelectorDialog";
import { isValidSafeUrl } from "@/lib/pageBuilderSafety";
import { extractYouTubeVideoId } from "@/lib/youtube";

export function BuilderInspector() {
  const { formData, selectedElementId, handleUpdateSection, handleChangeSectionLayout, handleUpdateBlock } = usePageBuilder();
  const builderData = formData.builderData || { version: "1.0", sections: [] };

  const [isMediaOpen, setIsMediaOpen] = React.useState(false);
  const [mediaTarget, setMediaTarget] = React.useState<{
    sectionId: string;
    blockId: string;
    field: string;
    columnId?: string;
  } | null>(null);

  // Find the selected element (could be a section or a block, searching main blocks and column blocks)
  let selectedSection: PageBuilderSection | undefined;
  let selectedBlock: PageBlock | undefined;
  let selectedColumnId: string | undefined;

  for (const section of builderData.sections) {
    if (section.id === selectedElementId) {
      selectedSection = section;
      break;
    }
    
    const block = section.blocks?.find(b => b.id === selectedElementId);
    if (block) {
      selectedSection = section;
      selectedBlock = block;
      break;
    }

    if (section.columns) {
      for (const col of section.columns) {
        const colBlock = col.blocks?.find(b => b.id === selectedElementId);
        if (colBlock) {
          selectedSection = section;
          selectedBlock = colBlock;
          selectedColumnId = col.id;
          break;
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
          {selectedBlock ? "Block Settings" : "Section Settings"}
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
                columnId: selectedColumnId
              });
              setIsMediaOpen(true);
            }}
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
  return (
    <>
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

      {section.layout && section.layout !== "1-col" && (
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
