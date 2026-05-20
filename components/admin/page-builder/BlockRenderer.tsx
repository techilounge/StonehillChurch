import * as React from "react";
import { PageBlock } from "@/types/pageBuilder";
import { usePageBuilder } from "./PageBuilderContext";
import { ChevronUp, ChevronDown } from "lucide-react";
import { isValidSafeUrl, sanitizeCornerRadius } from "@/lib/pageBuilderSafety";
import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from "@/lib/youtube";
import { BlockResizer } from "./BlockResizer";

interface BlockRendererProps {
  block: PageBlock;
  isSelected: boolean;
  index: number;
  totalBlocks: number;
  sectionId: string;
  columnId?: string;
  onClick: (e: React.MouseEvent) => void;
  onRemove: (e: React.MouseEvent) => void;
}

export function BlockRenderer({ block, isSelected, index, totalBlocks, sectionId, columnId, onClick, onRemove }: BlockRendererProps) {
  const { handleReorderBlocks } = usePageBuilder();
  // Safe extraction of properties depending on the block type.
  const { content } = block;

  // Image/video blocks support container-level drag-to-resize.
  const isResizable = block.type === "image" || block.type === "video";
  const locked = content?.lockAspectRatio !== false;
  const fixedHeight = isResizable && !locked && typeof content?.height === "number";
  const hasMedia = isResizable && !!content?.url;
  const align = block.style?.textAlign;
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
      {hasMedia && (
        <BlockResizer block={block} sectionId={sectionId} columnId={columnId} isSelected={isSelected} />
      )}

      {/* Editor overlay handles */}
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
      
      {/* Block Content (pointer-events-none so click bubbles to the container to select it) */}
      <div className={`pointer-events-none p-4 ${fixedHeight ? "h-full flex flex-col" : ""}`}>
        {block.type === "heading" && (
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
                } ${content.alignment === "center" ? "text-center" : content.alignment === "right" ? "text-right" : "text-left"}`
              }, 
              content.text || "Heading Text"
            )}
            {(!content.text || content.text.trim() === "") && (
              <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs px-2.5 py-1 rounded border border-yellow-200 font-medium inline-flex items-center gap-1">
                ⚠️ Empty heading text
              </div>
            )}
          </div>
        )}

        {block.type === "paragraph" && (
          <div>
            <p className={`text-slate-700 leading-relaxed font-sans ${
              content.alignment === "center" ? "text-center" : content.alignment === "right" ? "text-right" : "text-left"
            }`}>
              {content.text || "Paragraph text goes here."}
            </p>
            {(!content.text || content.text.trim() === "") && (
              <div className="mt-2 bg-yellow-50 text-yellow-800 text-xs px-2.5 py-1 rounded border border-yellow-200 font-medium inline-flex items-center gap-1">
                ⚠️ Paragraph is empty
              </div>
            )}
          </div>
        )}

        {block.type === "image" && (
          <div className={`relative ${fixedHeight ? "flex flex-col flex-1 min-h-0" : ""}`}>
            {content.url ? (
              <>
                <div
                  className={`relative rounded overflow-hidden border border-slate-200 ${fixedHeight ? "flex-1 min-h-0" : ""}`}
                  style={cornerCss ? { borderRadius: cornerCss } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={content.url} alt={content.alt || ""} className={`block w-full ${fixedHeight ? (content.objectFit === "cover" ? "h-full object-cover" : "h-full object-contain") : "h-auto"}`} />
                  {(!content.alt || content.alt.trim() === "") && (
                    <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow border border-yellow-300 font-medium">
                      ⚠️ Missing alt text
                    </div>
                  )}
                </div>
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

        {block.type === "button" && (
          <div>
            <div className={`flex ${
              content.alignment === "center" ? "justify-center" : content.alignment === "right" ? "justify-end" : "justify-start"
            }`}>
              <span className={`inline-block px-6 py-3 rounded-full font-sans font-medium transition-colors shadow-sm ${
                content.variant === "outline" ? "border-2 border-stonehill-primary text-stonehill-primary bg-transparent" :
                content.variant === "secondary" ? "bg-stonehill-secondary text-stonehill-dark" :
                "bg-stonehill-primary text-white"
              }`}>
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
        )}

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

        {block.type === "cta" && (
          <div className={`p-8 md:p-12 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 ${
            content.background === "accent" ? "bg-stonehill-accent text-white" :
            content.background === "light" ? "bg-stonehill-light text-stonehill-dark border border-stonehill-border" :
            "bg-stonehill-primary text-white"
          }`}>
            <div className="flex-1 text-center md:text-left">
              <h2 className={`text-2xl md:text-3xl font-display font-bold mb-2 ${content.background === "light" ? "text-stonehill-dark" : "text-white"}`}>
                {content.title || "Call to Action"}
              </h2>
              <p className={`font-sans text-lg ${content.background === "light" ? "text-slate-600" : "text-white/90"}`}>
                {content.text || "Compelling description to encourage users to click the button below."}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className={`inline-block px-8 py-3 rounded-full font-sans font-medium transition-colors shadow-md ${
                content.background === "light" ? "bg-stonehill-primary text-white" :
                "bg-white text-stonehill-dark"
              }`}>
                {content.buttonLabel || content.buttonText || "Take Action"}
              </span>
            </div>

            {content.buttonUrl && !isValidSafeUrl(content.buttonUrl) && (
              <div className="absolute bottom-2 left-2 bg-red-100 text-red-850 text-xs px-2.5 py-1 rounded border border-red-200 font-medium inline-flex items-center gap-1">
                ⚠️ Unsafe CTA button URL
              </div>
            )}
            {content.buttonUrl && !content.buttonLabel && !content.buttonText && (
              <div className="absolute bottom-2 left-2 bg-yellow-100 text-yellow-850 text-xs px-2.5 py-1 rounded border border-yellow-200 font-medium inline-flex items-center gap-1">
                ⚠️ CTA button label is required for link
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
