import * as React from "react";
import { PageBlock, BlockType } from "@/types/pageBuilder";
import { usePageBuilder } from "./PageBuilderContext";
import { ChevronUp, ChevronDown, Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { isValidSafeUrl, sanitizeCornerRadius, sanitizeHtml, formatParagraphHtml, isValidGoogleMapsEmbedUrl } from "@/lib/pageBuilderSafety";
import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from "@/lib/youtube";
import { BlockResizer } from "./BlockResizer";
import { getAutoFocalPoint } from "@/lib/mediaHandling";

function spacingShorthand(
  v: { top: number; right: number; bottom: number; left: number; unit?: string; token?: string } | undefined,
): string | null {
  if (!v) return null;
  if (v.token && ["xs", "sm", "md", "lg", "xl"].includes(v.token)) {
    const ref = `var(--pb-space-${v.token})`;
    return `${ref} ${ref} ${ref} ${ref}`;
  }
  const u = v.unit ?? "px";
  return `${v.top}${u} ${v.right}${u} ${v.bottom}${u} ${v.left}${u}`;
}

function effectiveSpacing(
  device: string,
  desktop: any,
  tablet: any,
  mobile: any,
): any {
  if (device === "mobile") return mobile ?? tablet ?? desktop;
  if (device === "tablet") return tablet ?? desktop;
  return desktop;
}

function previewSpacingStyle(
  device: string,
  style: any,
): React.CSSProperties {
  if (!style) return {};
  const p = spacingShorthand(
    effectiveSpacing(device, style.paddingValues, style.paddingValuesTablet, style.paddingValuesMobile),
  );
  const m = spacingShorthand(
    effectiveSpacing(device, style.marginValues, style.marginValuesTablet, style.marginValuesMobile),
  );
  return {
    ...(p ? { padding: p } : {}),
    ...(m ? { margin: m } : {}),
  };
}

function AddBlockMenu({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const basicBlocks: BlockType[] = ["heading", "paragraph", "image", "button", "divider", "spacer"];
  const advancedBlocks: BlockType[] = ["row", "video", "card", "gallery", "carousel", "iconText", "iconBox", "googleMap", "countdown", "cta", "html"];

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

function NestedDroppableColumn({
  col,
  colIdx,
  cols,
  sectionId,
  rowBlockId,
  selectedElementId,
  setSelectedElementId,
  canModifyLayout,
  handleRemoveNestedColumn,
  handleAddBlock,
  renderBlock,
  isMobileStacked,
  devicePreview,
}: any) {
  const { setNodeRef } = useDroppable({
    id: col.id,
    data: { type: "column", sectionId, columnId: col.id },
  });
  
  const width = col.width || `${100 / cols.length}%`;
  const isColSelected = selectedElementId === col.id;
  const isStackedInPreview = devicePreview === "mobile" && isMobileStacked;

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedElementId(col.id);
      }}
      className={`relative flex-grow flex flex-col min-h-[100px] border border-dashed rounded p-3 transition-colors pointer-events-auto cursor-pointer md:w-auto ${
        isMobileStacked ? "w-full md:flex-none" : "flex-none"
      } ${
        isColSelected
          ? "border-stonehill-accent bg-stonehill-accent/5 ring-1 ring-stonehill-accent"
          : "border-slate-200 hover:border-slate-350 bg-slate-50/30"
      }`}
      style={{
        width: isStackedInPreview ? undefined : width,
        flexBasis: isStackedInPreview ? undefined : width,
        color: col.style?.textColor,
        textAlign: col.style?.textAlign,
        ...previewBgFillStyle(col.style),
        ...previewSpacingStyle(devicePreview, col.style),
      } as React.CSSProperties}
    >
      <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase mb-2">
        <span>Col {colIdx + 1} ({width})</span>
        {canModifyLayout && cols.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveNestedColumn(sectionId, rowBlockId, col.id);
            }}
            className="text-red-500 hover:text-red-700 hover:underline cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-3 flex-grow mb-3">
        {col.blocks && col.blocks.length > 0 ? (
          col.blocks.map((nestedBlock: any, nestedIdx: number) => (
            <React.Fragment key={nestedBlock.id}>
              {renderBlock ? renderBlock(nestedBlock, nestedIdx, col.blocks.length, col.id) : null}
            </React.Fragment>
          ))
        ) : (
          <div className="flex items-center justify-center text-slate-400/60 py-6 border border-dashed border-slate-200/60 rounded bg-white/50">
            <span className="text-[10px]">Empty Column</span>
          </div>
        )}
      </div>

      {canModifyLayout && (
        <div className="pointer-events-auto">
          <AddBlockMenu onAdd={(type) => handleAddBlock(sectionId, type, col.id)} />
        </div>
      )}
    </div>
  );
}

function previewBgType(style: any): "none" | "color" | "image" | "gradient" {
  if (style?.backgroundType) return style.backgroundType;
  if (style?.backgroundGradient) return "gradient";
  if (style?.backgroundImage) return "image";
  if (style?.backgroundColor) return "color";
  return "none";
}

function previewBgFillStyle(style: any): React.CSSProperties {
  const type = previewBgType(style);
  if (type === "color" && style?.backgroundColor && style.backgroundColor !== "#ffffff") {
    return { backgroundColor: style.backgroundColor };
  }
  if (type === "image" && style?.backgroundImage && isValidSafeUrl(style.backgroundImage)) {
    return {
      backgroundImage: `url(${style.backgroundImage})`,
      backgroundSize: style.backgroundSize ?? "cover",
      backgroundPosition: style.backgroundPosition ?? "center center",
      backgroundRepeat: style.backgroundRepeat ?? "no-repeat",
      backgroundAttachment: "scroll",
    };
  }
  if (type === "gradient" && style?.backgroundGradient) {
    const g = style.backgroundGradient;
    return { backgroundImage: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})` };
  }
  return {};
}

interface BlockRendererProps {
  block: PageBlock;
  isSelected: boolean;
  index: number;
  totalBlocks: number;
  sectionId: string;
  columnId?: string;
  onClick: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
  renderBlock?: (block: PageBlock, index: number, totalBlocks: number, columnId: string) => React.ReactNode;
}

export function BlockRenderer({ block, isSelected, index, totalBlocks, sectionId, columnId, onClick, onRemove, renderBlock }: BlockRendererProps) {
  const { 
    handleReorderBlocks, 
    canModifyLayout,
    devicePreview,
    selectedElementId,
    setSelectedElementId,
    handleAddBlock,
    handleAddNestedColumn,
    handleRemoveNestedColumn,
  } = usePageBuilder();
  // Safe extraction of properties depending on the block type.
  const { content } = block;

  // Image/video blocks support container-level drag-to-resize.
  const isResizable = block.type === "image" || block.type === "video";
  const locked = content?.lockAspectRatio !== false;
  const fixedHeight = isResizable && !locked && typeof content?.height === "number";
  const hasMedia = isResizable && !!content?.url;
  const align = block.style?.textAlign || content?.alignment || "left";
  const cornerCss = isResizable ? sanitizeCornerRadius(content?.cornerRadius) : undefined;
  const containerStyle: React.CSSProperties | undefined = isResizable
    ? {
        width: typeof content?.width === "string" && content.width ? content.width : undefined,
        height: fixedHeight ? `${content.height}px` : undefined,
        marginLeft: align === "center" || align === "right" ? "auto" : undefined,
        marginRight: align === "center" || align === "left" ? "auto" : undefined,
      }
    : undefined;

  return (
    <div
      data-block-id={block.id}
      className={`relative group border border-dashed rounded-lg cursor-pointer ${
        isResizable ? "transition-colors max-w-full" : "transition-all"
      } ${
        isSelected
          ? "border-stonehill-accent bg-stonehill-accent/5 ring-1 ring-stonehill-accent ring-opacity-50"
          : "border-slate-300 hover:border-slate-400"
      }`}
      style={containerStyle}
      onClick={onClick}
    >
      {hasMedia && canModifyLayout && (
        <BlockResizer block={block} sectionId={sectionId} columnId={columnId} isSelected={isSelected} />
      )}

      {/* Editor overlay handles */}
      {canModifyLayout && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10 flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleReorderBlocks(sectionId, index, index - 1, columnId); }}
            className="h-6 w-6 flex items-center justify-center rounded bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200 shadow-sm transition-colors disabled:opacity-30"
            title="Move block up"
            aria-label="Move block up"
            disabled={index === 0}
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleReorderBlocks(sectionId, index, index + 1, columnId); }}
            className="h-6 w-6 flex items-center justify-center rounded bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200 shadow-sm transition-colors disabled:opacity-30"
            title="Move block down"
            aria-label="Move block down"
            disabled={index === totalBlocks - 1}
          >
            <ChevronDown className="h-3 w-3" />
          </button>
          <span className="text-[10px] bg-slate-800 text-white px-2 py-1 rounded shadow-sm opacity-80 uppercase tracking-wider font-mono flex items-center">
            {block.type}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(e); }}
            className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 shadow-sm transition-colors font-medium"
            title="Remove block"
            aria-label="Remove block"
          >
            Remove
          </button>
        </div>
      )}
      
      {/* Block Content (pointer-events-none so click bubbles to the container to select it) */}
      <div className={`pointer-events-none p-4 ${fixedHeight ? "h-full flex flex-col" : ""}`}>
        {block.type === "heading" && (() => {
          const hAlign = block.style?.textAlign || content.alignment || "left";
          const alignClass = hAlign === "center" ? "text-center" : hAlign === "right" ? "text-right" : "text-left";
          return (
            <div>
              {React.createElement(
                content.level || "h2", 
                { 
                  className: `font-display font-bold text-stonehill-dark ${
                    content.level === "h1" ? "text-4xl md:text-5xl" :
                    content.level === "h2" ? "text-3xl md:text-4xl" :
                    content.level === "h3" ? "text-2xl md:text-3xl" :
                    content.level === "h4" ? "text-xl md:text-2xl" :
                    content.level === "h5" ? "text-lg md:text-xl" :
                    "text-base md:text-lg"
                  } ${alignClass}`
                }, 
                content.text || "Heading Text"
              )}
              {(!content.text || content.text.trim() === "") && (
                <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs px-2.5 py-1 rounded border border-yellow-200 font-medium inline-flex items-center gap-1">
                  ⚠️ Empty heading text
                </div>
              )}
            </div>
          );
        })()}

        {block.type === "paragraph" && (() => {
          const pAlign = block.style?.textAlign || content.alignment || "left";
          const alignClass = pAlign === "center" ? "text-center" : pAlign === "right" ? "text-right" : "text-left";
          const hasText = !!(content.text && content.text.trim());
          return (
            <div>
              {hasText ? (
                <div
                  className={`text-slate-700 leading-relaxed font-sans paragraph-content ${alignClass}`}
                  dangerouslySetInnerHTML={{ __html: formatParagraphHtml(content.text) }}
                />
              ) : (
                <p className={`text-slate-700 leading-relaxed font-sans ${alignClass}`}>
                  Paragraph text goes here.
                </p>
              )}
              {!hasText && (
                <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs px-2.5 py-1 rounded border border-yellow-200 font-medium inline-flex items-center gap-1">
                  ⚠️ Paragraph is empty
                </div>
              )}
            </div>
          );
        })()}

        {block.type === "html" && (() => {
          const hasHtml = !!(content.html && content.html.trim());
          return (
            <div>
              {hasHtml ? (
                <div
                  className="prose prose-sm max-w-none custom-html-content"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.html) }}
                />
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded text-slate-400 text-xs font-mono text-center">
                  &lt;Custom HTML Block (Empty)&gt;
                </div>
              )}
            </div>
          );
        })()}

        {block.type === "image" && (
          <div className={`relative ${fixedHeight ? "flex flex-col flex-1 min-h-0" : ""}`}>
            {content.url ? (
              <>
                {(() => {
                  const hasRatio = content.aspectRatio && content.aspectRatio !== "auto" && content.aspectRatio !== "default";
                  const ratioVal = hasRatio ? content.aspectRatio.replace(":", " / ") : undefined;
                  
                  let fx = 50;
                  let fy = 50;
                  if (typeof content.focalPointX === "number" && typeof content.focalPointY === "number" && content.focalPointAuto !== true) {
                    fx = content.focalPointX;
                    fy = content.focalPointY;
                  } else {
                    const autoPt = getAutoFocalPoint(content.url);
                    fx = autoPt.x;
                    fy = autoPt.y;
                  }
                  
                  return (
                    <div
                      className={`relative rounded overflow-hidden border border-slate-200 ${fixedHeight ? "flex-1 min-h-0" : ""}`}
                      style={{
                        ...(cornerCss ? { borderRadius: cornerCss } : {}),
                        aspectRatio: ratioVal,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={content.url}
                        alt={content.alt || ""}
                        className={`block w-full ${
                          hasRatio || fixedHeight 
                            ? "h-full object-cover" 
                            : "h-auto"
                        }`}
                        style={{
                          objectPosition: `${fx}% ${fy}%`,
                        }}
                      />
                      {(!content.alt || content.alt.trim() === "") && (
                        <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow border border-yellow-300 font-medium">
                          ⚠️ Missing alt text
                        </div>
                      )}
                    </div>
                  );
                })()}
                {content.caption && (
                  <div className="bg-slate-50 text-slate-500 text-xs p-2 text-center border border-t-0 border-slate-200 rounded-b">
                    {content.caption}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-slate-100 border border-slate-200 h-48 rounded flex flex-col items-center justify-center text-slate-400">
                <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span className="text-sm">Image Placeholder</span>
              </div>
            )}
            
            {content.url && !isValidSafeUrl(content.url) && (
              <div className="mt-2 bg-red-50 text-red-800 text-xs px-2.5 py-1 rounded border border-red-200 font-medium inline-flex items-center gap-1">
                ⚠️ Unsafe Image URL: "{content.url}"
              </div>
            )}
            {!content.url && (
              <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs px-2.5 py-1 rounded border border-yellow-200 font-medium inline-flex items-center gap-1">
                ⚠️ Missing image URL
              </div>
            )}
          </div>
        )}

        {block.type === "button" && (() => {
          const pad = content.padding || {};
          const paddingStyle: React.CSSProperties = {
            paddingTop: pad.top ?? "8px",
            paddingRight: pad.right ?? "16px",
            paddingBottom: pad.bottom ?? "8px",
            paddingLeft: pad.left ?? "16px",
          };
          const btnAlign = block.style?.textAlign || content.alignment || "left";
          const alignClass = btnAlign === "center" ? "justify-center" : btnAlign === "right" ? "justify-end" : "justify-start";
          return (
            <div>
              <div className={`flex ${alignClass}`}>
                <span 
                  className={`inline-block rounded-full font-sans font-medium transition-colors shadow-sm ${
                    content.variant === "outline" ? "border-2 border-stonehill-primary text-stonehill-primary bg-transparent" :
                    content.variant === "secondary" ? "bg-stonehill-secondary text-stonehill-dark" :
                    "bg-stonehill-primary text-white"
                  }`}
                  style={paddingStyle}
                >
                  {content.label || content.text || "Button label"}
                </span>
              </div>
              {(!content.label && !content.text) && (
                <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs px-2.5 py-1 rounded border border-yellow-200 font-medium inline-flex items-center gap-1">
                  ⚠️ Button label is empty
                </div>
              )}
              {content.url && !isValidSafeUrl(content.url) && (
                <div className="mt-2 bg-red-50 text-red-800 text-xs px-2.5 py-1 rounded border border-red-200 font-medium inline-flex items-center gap-1">
                  ⚠️ Unsafe URL: "{content.url}"
                </div>
              )}
            </div>
          );
        })()}

        {block.type === "spacer" && (
          <div className="flex items-center justify-center border border-dashed border-slate-200 bg-slate-50 opacity-50 rounded" style={{ height: content.height || "2rem" }}>
            <span className="text-xs text-slate-400">{content.height || "2rem"} Spacer</span>
          </div>
        )}

        {block.type === "divider" && (
          <div className="py-4">
            <hr className={`border-t-2 ${content.style === "dashed" ? "border-dashed" : content.style === "dotted" ? "border-dotted" : "border-solid"} border-stonehill-border`} />
          </div>
        )}

        {block.type === "video" && (() => {
          const ytId = content.url ? extractYouTubeVideoId(content.url) : null;
          const thumbUrl = ytId ? getYouTubeThumbnailUrl(ytId) : null;
          return (
            <div className={fixedHeight ? "flex flex-col flex-1 min-h-0" : ""}>
              <div
                className={`bg-slate-900 border border-slate-800 rounded-lg ${fixedHeight ? "flex-1 min-h-0" : "aspect-video"} flex flex-col items-center justify-center text-slate-300 relative overflow-hidden shadow-sm`}
                style={cornerCss ? { borderRadius: cornerCss } : undefined}
              >
                {thumbUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbUrl} alt={content.title || "Video thumbnail"} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-4">
                      <svg className="w-12 h-12 text-stonehill-accent drop-shadow mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      <span className="text-sm font-semibold tracking-wide text-white drop-shadow text-center">{content.title || "YouTube Video"}</span>
                      <span className="text-xs text-white/80 mt-1 font-mono bg-black/45 px-2 py-0.5 rounded border border-white/10 drop-shadow">{ytId}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 mb-3 text-white/50" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    <span className="text-sm font-semibold tracking-wide text-white">{content.title || "Video Player"}</span>
                    <span className="text-xs text-white/60 mt-1 max-w-[80%] truncate px-4">{content.url || "No URL provided"}</span>
                  </>
                )}
                <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
              </div>

              {!content.url ? (
                <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs px-2.5 py-1 rounded border border-yellow-200 font-medium inline-flex items-center gap-1">
                  ⚠️ YouTube URL is required
                </div>
              ) : !ytId ? (
                <div className="mt-2 bg-red-50 text-red-800 text-xs px-2.5 py-1 rounded border border-red-200 font-medium inline-flex items-center gap-1">
                  ⚠️ Invalid YouTube URL
                </div>
              ) : !isValidSafeUrl(content.url) ? (
                <div className="mt-2 bg-red-50 text-red-800 text-xs px-2.5 py-1 rounded border border-red-200 font-medium inline-flex items-center gap-1">
                  ⚠️ Unsafe URL: "{content.url}"
                </div>
              ) : null}
            </div>
          );
        })()}

        {block.type === "card" && (
          <div className="bg-white border border-stonehill-border rounded-xl p-6 shadow-soft hover:shadow-lg transition-shadow">
            {content.imageUrl && (
              <div className="h-40 bg-slate-100 -mt-6 -mx-6 mb-4 rounded-t-xl overflow-hidden border-b border-stonehill-border flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={content.imageUrl} alt={content.imageAlt || content.title || "Card image"} className="w-full h-full object-cover" />
              </div>
            )}
            <h3 className="text-xl font-display font-bold text-stonehill-dark">{content.title || "Card Title"}</h3>
            <p className="text-slate-600 mt-2 text-sm leading-relaxed font-sans">{content.description || content.text || "Card description text goes here."}</p>
            {(content.buttonLabel || content.buttonText) && (
              <div className="mt-4 text-stonehill-primary font-medium text-sm flex items-center">
                {content.buttonLabel || content.buttonText} <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            )}

            {content.imageUrl && !isValidSafeUrl(content.imageUrl) && (
              <div className="mt-2 bg-red-50 text-red-800 text-xs px-2.5 py-1 rounded border border-red-200 font-medium inline-flex items-center gap-1">
                ⚠️ Unsafe card image URL
              </div>
            )}
            {content.buttonUrl && !isValidSafeUrl(content.buttonUrl) && (
              <div className="mt-2 bg-red-50 text-red-800 text-xs px-2.5 py-1 rounded border border-red-200 font-medium inline-flex items-center gap-1">
                ⚠️ Unsafe card button URL
              </div>
            )}
            {content.buttonUrl && !content.buttonLabel && !content.buttonText && (
              <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs px-2.5 py-1 rounded border border-yellow-200 font-medium inline-flex items-center gap-1">
                ⚠️ Card button label is required for link
              </div>
            )}
          </div>
        )}

        {block.type === "iconText" && (
          <div className={`flex items-start gap-4 ${
            content.alignment === "center" ? "flex-col items-center text-center" : 
            content.alignment === "right" ? "flex-row-reverse text-right" : "flex-row text-left"
          }`}>
            <div className="h-12 w-12 bg-stonehill-primary/10 text-stonehill-primary rounded-full flex items-center justify-center flex-shrink-0">
              {content.iconUrl ? (
                <img src={content.iconUrl} alt="icon" className="w-6 h-6 object-contain" />
              ) : content.icon ? (
                <span className="text-xl">{content.icon}</span>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              )}
            </div>
            <div>
              <h4 className="font-display font-bold text-lg text-stonehill-dark">{content.title || "Icon Feature"}</h4>
              <p className="text-slate-600 text-sm mt-1 font-sans leading-relaxed">{content.description || content.text || "Description of this feature or highlight."}</p>
            </div>
          </div>
        )}

        {block.type === "iconBox" && (() => {
          const align = content.alignment || "center";
          const itemsClass =
            align === "center" ? "items-center text-center" :
            align === "right" ? "items-end text-right" : "items-start text-left";
          const Heading = (content.level || "h3") as React.ElementType;
          const sizeClass =
            content.level === "h1" ? "text-3xl md:text-4xl" :
            content.level === "h2" ? "text-2xl md:text-3xl" :
            content.level === "h3" ? "text-xl md:text-2xl" :
            content.level === "h4" ? "text-lg md:text-xl" :
            content.level === "h5" ? "text-base md:text-lg" :
            content.level === "h6" ? "text-sm md:text-base" : "text-xl md:text-2xl";
          const isImage = content.variant === "image";

          const lockAspect = content.lockAspectRatio === true;
          const widthVal = typeof content.imageWidth === "string" && content.imageWidth ? content.imageWidth : undefined;
          const heightVal = !lockAspect && typeof content.imageHeight === "string" && content.imageHeight ? content.imageHeight : undefined;
          const fitVal = content.objectFit || "cover";
          const cornerCss = sanitizeCornerRadius(content.cornerRadius);
          const shadowClass =
            content.shadowSize === "sm" ? "shadow-sm" :
            content.shadowSize === "md" ? "shadow-md" :
            content.shadowSize === "lg" ? "shadow-lg" : "";
          const wrapperStyle: React.CSSProperties = {
            width: widthVal,
            height: heightVal,
            borderRadius: cornerCss || undefined,
          };
          if (content.border) {
            const bw = Math.max(0, Math.min(20, Number(content.borderWidth) || 2));
            wrapperStyle.borderWidth = `${bw}px`;
            wrapperStyle.borderStyle = "solid";
            wrapperStyle.borderColor = typeof content.borderColor === "string" ? content.borderColor : "#e7ab10";
          }
          const hasExplicitSize = !!(widthVal || heightVal);
          const defaultSizeClass = hasExplicitSize ? "" : (isImage ? "w-24 h-24" : "w-16 h-16");
          const radiusClass = cornerCss ? "" : "rounded-full";

          return (
            <div className={`flex flex-col gap-3 ${itemsClass}`}>
              <div
                className={`flex-shrink-0 ${defaultSizeClass} ${!isImage ? "bg-stonehill-primary/10 text-stonehill-primary" : ""} ${shadowClass} ${radiusClass} flex items-center justify-center overflow-hidden`}
                style={wrapperStyle}
              >
                {isImage && content.iconUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={content.iconUrl}
                    alt={content.alt || ""}
                    className={`block w-full ${lockAspect ? "h-auto" : "h-full"}`}
                    style={lockAspect ? undefined : { objectFit: fitVal }}
                  />
                ) : content.iconUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={content.iconUrl} alt="icon" className="w-8 h-8 object-contain" />
                ) : content.icon ? (
                  <span className="text-2xl">{content.icon}</span>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                )}
              </div>
              <Heading className={`font-display font-bold text-stonehill-dark ${sizeClass}`}>
                {content.title || "Feature title"}
              </Heading>
              <p className="text-slate-600 text-sm max-w-md font-sans leading-relaxed">{content.description || "Short supporting description."}</p>
              {content.url && !isValidSafeUrl(content.url) && (
                <div className="mt-2 bg-red-50 text-red-800 text-xs px-2.5 py-1 rounded border border-red-200 font-medium inline-flex items-center gap-1">
                  ⚠️ Unsafe URL: "{content.url}"
                </div>
              )}
            </div>
          );
        })()}

        {block.type === "gallery" && (() => {
          const images = Array.isArray(content.images) ? content.images : [];
          const columns = content.columns === 2 ? "grid-cols-2" : content.columns === 4 ? "grid-cols-4" : "grid-cols-3";
          const gutter = content.gutter === "sm" ? "gap-1" : content.gutter === "lg" ? "gap-6" : "gap-3";
          const rounded = content.rounded !== false;
          if (images.length === 0) {
            return (
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-8 text-center text-slate-400">
                <span className="text-sm">No images yet. Add some in the Inspector →</span>
              </div>
            );
          }
          return (
            <div className={`grid ${columns} ${gutter}`}>
              {images.map((img: { url?: string; alt?: string; caption?: string }, i: number) => (
                <div key={i} className={`relative ${rounded ? "rounded-lg" : ""} overflow-hidden bg-slate-100 aspect-square`}>
                  {img?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No image</div>
                  )}
                  {img?.caption && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs p-1.5 truncate">{img.caption}</div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {block.type === "carousel" && (() => {
          const images = Array.isArray(content.images) ? content.images : [];
          const heightPx = typeof content.height === "number" ? Math.max(160, Math.min(800, content.height)) : 480;
          const rounded = content.rounded !== false;
          const shadow = !!content.shadow;
          if (images.length === 0) {
            return (
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-8 text-center text-slate-400">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-sm">Add images to the carousel in the Inspector →</span>
              </div>
            );
          }
          const first = images[0];
          return (
            <div
              className={`relative ${rounded ? "rounded-lg" : ""} ${shadow ? "shadow-lg" : ""} overflow-hidden bg-slate-900`}
              style={{ height: `${heightPx}px` }}
            >
              {first?.url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={first.url} alt={first.alt || ""} className="w-full h-full object-cover" />
              ) : null}
              <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                Carousel • {images.length} image{images.length === 1 ? "" : "s"}
              </div>
              {content.autoplay && (
                <div className="absolute top-3 right-3 bg-stonehill-accent text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded">Autoplay</div>
              )}
            </div>
          );
        })()}

        {block.type === "countdown" && (() => {
          const target = content.targetDateTime ? new Date(content.targetDateTime) : null;
          const isValid = target && !isNaN(target.getTime());
          const diffMs = isValid ? Math.max(0, target.getTime() - Date.now()) : 0;
          const days = Math.floor(diffMs / 86400000);
          const hours = Math.floor((diffMs % 86400000) / 3600000);
          const minutes = Math.floor((diffMs % 3600000) / 60000);
          const seconds = Math.floor((diffMs % 60000) / 1000);
          const alignClass =
            content.alignment === "left" ? "items-start text-left" :
            content.alignment === "right" ? "items-end text-right" :
            "items-center text-center";
          const accent = typeof content.accentColor === "string" ? content.accentColor : "#e7ab10";
          const isBoxed = content.style !== "inline";
          const cells = [
            { value: days, label: "Days" },
            { value: hours, label: "Hours" },
            { value: minutes, label: "Min" },
            { value: seconds, label: "Sec" },
          ];
          return (
            <div className={`flex flex-col gap-3 ${alignClass}`}>
              {content.label && (
                <span className="text-sm font-medium text-slate-700">{content.label}</span>
              )}
              {isBoxed ? (
                <div className="flex gap-2 flex-wrap">
                  {cells.map((c) => (
                    <div key={c.label} className="bg-white border border-slate-200 rounded-lg px-3 py-2 min-w-[64px] text-center shadow-sm">
                      <div className="text-2xl font-bold tabular-nums" style={{ color: accent }}>{String(c.value).padStart(2, "0")}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{c.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-2xl font-bold tabular-nums" style={{ color: accent }}>
                  {days}d · {String(hours).padStart(2, "0")}h · {String(minutes).padStart(2, "0")}m · {String(seconds).padStart(2, "0")}s
                </div>
              )}
              {!isValid && (
                <div className="bg-yellow-50 text-yellow-800 text-xs px-2.5 py-1 rounded border border-yellow-200 font-medium inline-flex items-center gap-1">
                  ⚠️ Set a valid target date in the Inspector
                </div>
              )}
            </div>
          );
        })()}

        {block.type === "googleMap" && (() => {
          const validEmbed = content.embedUrl && isValidGoogleMapsEmbedUrl(content.embedUrl);
          const height = typeof content.height === "number" ? content.height : 400;
          const previewHeight = Math.max(150, Math.min(500, height));
          return (
            <div>
              <div
                className="w-full bg-slate-100 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-500 overflow-hidden"
                style={{ height: `${previewHeight}px` }}
              >
                <svg className="w-10 h-10 mb-2 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <circle cx="12" cy="11" r="3" strokeWidth="1.5" />
                </svg>
                <span className="text-sm font-medium">Google Map</span>
                {content.embedUrl ? (
                  <span className="text-xs text-slate-400 mt-1 max-w-[80%] truncate px-4">{content.embedUrl}</span>
                ) : (
                  <span className="text-xs text-slate-400 mt-1">Add an embed URL in the Inspector →</span>
                )}
              </div>
              {!content.embedUrl ? (
                <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs px-2.5 py-1 rounded border border-yellow-200 font-medium inline-flex items-center gap-1">
                  ⚠️ Embed URL is required
                </div>
              ) : !validEmbed ? (
                <div className="mt-2 bg-red-50 text-red-800 text-xs px-2.5 py-1 rounded border border-red-200 font-medium inline-flex items-center gap-1">
                  ⚠️ Not a Google Maps embed URL
                </div>
              ) : null}
            </div>
          );
        })()}

        {block.type === "cta" && (() => {
          const safeBgImg = isValidSafeUrl(content.backgroundImage) ? (content.backgroundImage || "") : "";
          const padClass =
            content.padding === "small" ? "p-6 md:p-8" :
            content.padding === "large" ? "p-12 md:p-20" :
            "p-8 md:p-12";
          const isLight = content.background === "light";
          const ctaStyle: React.CSSProperties = safeBgImg
            ? { backgroundImage: `url(${safeBgImg})`, backgroundSize: "cover", backgroundPosition: "center" }
            : {};
          return (
            <div
              style={ctaStyle}
              className={`relative ${padClass} rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden ${
                safeBgImg ? "bg-stonehill-primary text-white" :
                content.background === "accent" ? "bg-stonehill-accent text-white" :
                isLight ? "bg-stonehill-light text-stonehill-dark border border-stonehill-border" :
                "bg-stonehill-primary text-white"
              }`}
            >
              {safeBgImg && <div className="absolute inset-0 bg-black/55" />}
              <div className="relative flex-1 text-center md:text-left">
                {content.subheading && (
                  <p className="italic text-sm md:text-base mb-2 text-stonehill-accent">{content.subheading}</p>
                )}
                <h2 className={`text-2xl md:text-3xl font-display font-bold mb-2 ${!safeBgImg && isLight ? "text-stonehill-dark" : "text-white"}`}>
                  {content.title || "Call to Action"}
                </h2>
                <p className={`font-sans text-lg ${!safeBgImg && isLight ? "text-slate-600" : "text-white/90"}`}>
                  {content.text || "Compelling description to encourage users to click the button below."}
                </p>
              </div>
              <div className="relative flex-shrink-0">
                <span className={`inline-block px-8 py-3 rounded-full font-sans font-medium transition-colors shadow-md ${
                  safeBgImg || !isLight ? "bg-white text-stonehill-dark" : "bg-stonehill-primary text-white"
                }`}>
                  {content.buttonLabel || content.buttonText || "Take Action"}
                </span>
              </div>

              {content.buttonUrl && !isValidSafeUrl(content.buttonUrl) && (
                <div className="absolute bottom-2 left-2 bg-red-100 text-red-850 text-xs px-2.5 py-1 rounded border border-red-200 font-medium inline-flex items-center gap-1">
                  ⚠️ Unsafe CTA button URL
                </div>
              )}
              {content.backgroundImage && !isValidSafeUrl(content.backgroundImage) && (
                <div className="absolute bottom-2 left-2 bg-red-100 text-red-850 text-xs px-2.5 py-1 rounded border border-red-200 font-medium inline-flex items-center gap-1">
                  ⚠️ Unsafe background image URL
                </div>
              )}
              {content.buttonUrl && !content.buttonLabel && !content.buttonText && (
                <div className="absolute bottom-2 left-2 bg-yellow-100 text-yellow-850 text-xs px-2.5 py-1 rounded border border-yellow-200 font-medium inline-flex items-center gap-1">
                  ⚠️ CTA button label is required for link
                </div>
              )}
            </div>
          );
        })()}

        {block.type === "row" && (() => {
          const cols = content.columns || [];
          const responsive = content.responsive || { desktop: "horizontal", tablet: "auto", mobile: "stacked" };
          const isMobileStacked = responsive.mobile !== "horizontal";
          
          const alignItems = block.style?.alignItems || "start";
          const alignClass =
            alignItems === "center" ? "items-center" :
            alignItems === "end" ? "items-end" :
            alignItems === "stretch" ? "items-stretch" :
            "items-start";
          
          return (
            <div className="w-full space-y-4">
              {canModifyLayout && (
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 pointer-events-auto">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Row Columns ({cols.length})</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddNestedColumn(sectionId, block.id);
                      }}
                      disabled={cols.length >= 4}
                      className="px-2 py-1 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors disabled:opacity-50"
                    >
                      + Add Col
                    </button>
                  </div>
                </div>
              )}

              <div
                className={`flex gap-4 w-full ${alignClass} ${
                  isMobileStacked ? "flex-col md:flex-row" : "flex-row"
                }`}
              >
                {cols.map((col: any, colIdx: number) => (
                  <NestedDroppableColumn
                    key={col.id || colIdx}
                    col={col}
                    colIdx={colIdx}
                    cols={cols}
                    sectionId={sectionId}
                    rowBlockId={block.id}
                    selectedElementId={selectedElementId}
                    setSelectedElementId={setSelectedElementId}
                    canModifyLayout={canModifyLayout}
                    handleRemoveNestedColumn={handleRemoveNestedColumn}
                    handleAddBlock={handleAddBlock}
                    renderBlock={renderBlock}
                    isMobileStacked={isMobileStacked}
                    devicePreview={devicePreview}
                  />
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
