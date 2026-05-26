"use client";

import React from "react";
import {
  PageBuilderDocument,
  PageBuilderRow,
  PageBuilderSection,
  PageColumn,
  PageBlock,
} from "@/types/pageBuilder";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { isValidSafeUrl, sanitizeHtml, sanitizeStyle, sanitizeCornerRadius } from "@/lib/pageBuilderSafety";
import { extractYouTubeVideoId, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from "@/lib/youtube";

interface PageBuilderRendererProps {
  document: PageBuilderDocument;
}

/**
 * Cross-axis alignment for the column row. Literal class strings (Tailwind
 * static scan) and md-scoped so stacked mobile columns stay full width.
 * Default `start` keeps each column at its own content height.
 */
const COLUMN_ALIGN_CLASS: Record<string, string> = {
  start: "md:items-start",
  center: "md:items-center",
  end: "md:items-end",
  stretch: "md:items-stretch",
};

export function PageBuilderRenderer({ document }: PageBuilderRendererProps) {
  if (!document || !document.sections || !Array.isArray(document.sections)) {
    return null;
  }

  return (
    <div className="page-builder-content">
      {document.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}

function SectionRenderer({ section }: { section: PageBuilderSection }) {
  const cleanStyle = sanitizeStyle(section.style || {}, false) || {};

  const bgStyle = cleanStyle.backgroundColor ? { backgroundColor: cleanStyle.backgroundColor } : {};
  // Allow configured background image if present
  const bgImage = section.style?.backgroundImage ? { backgroundImage: `url(${section.style.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};
  const textColor = cleanStyle.textColor ? { color: cleanStyle.textColor } : {};
  const padding = cleanStyle.padding || "py-12";
  const margin = cleanStyle.margin || "";
  const layoutWidth = cleanStyle.layoutWidth === "full" ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";
  
  const verticalSpacing = cleanStyle.verticalSpacing || "gap-6";
  const alignItems = COLUMN_ALIGN_CLASS[section.style?.alignItems || "start"];
  const justifyContent = section.style?.justifyContent ? `justify-${section.style.justifyContent}` : "";
  
  // Mobile stacking behavior
  let flexClass = "flex flex-col md:flex-row";
  if (section.style?.mobileStacking === "reverse") {
    flexClass = "flex flex-col-reverse md:flex-row";
  } else if (section.style?.mobileStacking === "keep") {
    flexClass = "flex flex-row";
  }

  const containerClasses = `relative ${padding} ${margin}`;
  const inlineStyles = { ...bgStyle, ...bgImage, ...textColor };

  // Preferred shape: render the section as a vertical stack of rows. Legacy
  // shapes (section.columns / section.blocks) still render via the original
  // branches so older documents keep working until they're re-saved.
  const hasRows = !!section.rows && section.rows.length > 0;

  return (
    <section className={containerClasses} style={inlineStyles}>
      <div className={layoutWidth}>
        {hasRows ? (
          <div className={`flex flex-col ${verticalSpacing}`}>
            {section.rows!.map((row) => (
              <RowRenderer key={row.id} row={row} />
            ))}
          </div>
        ) : section.type === "section" || section.type === "group" ? (
          <div className={`flex flex-col ${verticalSpacing}`}>
            {section.blocks?.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))}
          </div>
        ) : section.type === "columns" || section.type === "row" ? (
          <div className={`w-full ${flexClass} ${verticalSpacing} ${alignItems} ${justifyContent}`}>
            {section.columns?.map((col) => (
              <ColumnRenderer key={col.id} column={col} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function RowRenderer({ row }: { row: PageBuilderRow }) {
  const cleanStyle = sanitizeStyle(row.style || {}, false) || {};
  const bgStyle = cleanStyle.backgroundColor ? { backgroundColor: cleanStyle.backgroundColor } : {};
  const textColor = cleanStyle.textColor ? { color: cleanStyle.textColor } : {};
  const padding = cleanStyle.padding || "";
  const margin = cleanStyle.margin || "";
  const verticalSpacing = cleanStyle.verticalSpacing || "gap-6";
  const alignItems = COLUMN_ALIGN_CLASS[row.style?.alignItems || "start"];
  const justifyContent = row.style?.justifyContent ? `justify-${row.style.justifyContent}` : "";

  let flexClass = "flex flex-col md:flex-row";
  if (row.style?.mobileStacking === "reverse") flexClass = "flex flex-col-reverse md:flex-row";
  else if (row.style?.mobileStacking === "keep") flexClass = "flex flex-row";

  return (
    <div className={`${padding} ${margin}`} style={{ ...bgStyle, ...textColor }}>
      <div className={`w-full ${flexClass} ${verticalSpacing} ${alignItems} ${justifyContent}`}>
        {row.columns.map((col) => (
          <ColumnRenderer key={col.id} column={col} />
        ))}
      </div>
    </div>
  );
}

function ColumnRenderer({ column }: { column: PageColumn }) {
  const isCustomPct = column.width?.endsWith("%");

  // Legacy fraction keywords → Tailwind classes
  let widthClass = "flex-1"; // auto by default
  if (!isCustomPct) {
    if (column.width === "1/2") widthClass = "w-full md:w-1/2";
    else if (column.width === "1/3") widthClass = "w-full md:w-1/3";
    else if (column.width === "2/3") widthClass = "w-full md:w-2/3";
    else if (column.width === "1/4") widthClass = "w-full md:w-1/4";
    else if (column.width === "3/4") widthClass = "w-full md:w-3/4";
    else if (column.width === "full") widthClass = "w-full";
  }

  const cleanStyle = sanitizeStyle(column.style || {}, false) || {};
  const padding = cleanStyle.padding || "";
  const margin = cleanStyle.margin || "";
  const bgStyle = cleanStyle.backgroundColor ? { backgroundColor: cleanStyle.backgroundColor } : {};
  const textColor = cleanStyle.textColor ? { color: cleanStyle.textColor } : {};
  const textAlign = cleanStyle.textAlign ? `text-${cleanStyle.textAlign}` : "";

  // For custom percentage widths, use responsive-col class with CSS variable
  const colClassName = isCustomPct
    ? `responsive-col flex flex-col gap-4 ${padding} ${margin} ${textAlign}`
    : `${widthClass} flex flex-col gap-4 ${padding} ${margin} ${textAlign}`;

  const colInlineStyle: React.CSSProperties = {
    ...bgStyle,
    ...textColor,
    ...(isCustomPct ? { "--col-width": column.width } as React.CSSProperties : {}),
  };
  
  return (
    <div 
      className={colClassName}
      style={colInlineStyle}
    >
      {column.blocks?.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}

function SafeYouTubePlayer({ url, title, fixedHeight }: { url: string; title?: string; fixedHeight?: number }) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoId = extractYouTubeVideoId(url);

  if (!videoId) {
    return (
      <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-sans border border-slate-200">
        Invalid YouTube Video URL
      </div>
    );
  }

  const thumbnailUrl = getYouTubeThumbnailUrl(videoId);
  const embedUrl = getYouTubeEmbedUrl(videoId);

  // When the block's aspect ratio is unlocked, honor the explicit pixel height;
  // otherwise keep the default 16:9 ratio.
  const sizeClass = fixedHeight ? "w-full" : "aspect-video w-full";
  const sizeStyle = fixedHeight ? { height: fixedHeight } : undefined;

  if (isPlaying) {
    return (
      <div className={`${sizeClass} rounded-lg overflow-hidden shadow-md`} style={sizeStyle}>
        <iframe
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          style={fixedHeight ? undefined : { minHeight: '300px' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative ${sizeClass} rounded-lg overflow-hidden shadow-md cursor-pointer group bg-black`}
      style={sizeStyle}
      onClick={() => setIsPlaying(true)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src={thumbnailUrl} 
        alt={title || "Play video"} 
        className="w-full h-full object-cover opacity-80 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        <div className="w-16 h-16 rounded-full bg-stonehill-accent text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 duration-300">
          <svg className="w-8 h-8 ml-1 fill-white" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      {title && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h4 className="text-white text-base font-medium drop-shadow-sm font-sans truncate">{title}</h4>
        </div>
      )}
    </div>
  );
}

function BlockRenderer({ block }: { block: PageBlock }) {
  const { type, content, style = {} } = block;

  const getFontFamilyVar = (family?: string) => {
    switch (family) {
      case "heading": return "var(--font-display)";
      case "handwritten": return "var(--font-handwritten)";
      case "sans": return "var(--font-sans)";
      default: return undefined;
    }
  };

  const cleanStyle = sanitizeStyle(style, true) || {};

  const inlineStyles: React.CSSProperties = {
    padding: cleanStyle.padding,
    margin: cleanStyle.margin,
    color: cleanStyle.textColor,
    backgroundColor: cleanStyle.backgroundColor,
    fontSize: cleanStyle.fontSize,
    fontWeight: cleanStyle.fontWeight,
    fontFamily: getFontFamilyVar(cleanStyle.fontFamily),
  };

  const textAlignClass = cleanStyle.textAlign ? `text-${cleanStyle.textAlign}` : "";

  switch (type) {
    case "heading": {
      const HTag = (content?.level || "h2") as React.ElementType;
      const level = content?.level || "h2";
      const sizeClass = 
        level === "h1" ? "text-4xl md:text-5xl font-bold text-stonehill-dark" :
        level === "h2" ? "text-3xl md:text-4xl font-bold text-stonehill-dark" :
        level === "h3" ? "text-2xl md:text-3xl font-bold text-stonehill-dark" :
        level === "h4" ? "text-xl md:text-2xl font-bold text-stonehill-dark" :
        level === "h5" ? "text-lg md:text-xl font-bold text-stonehill-dark" :
        "text-base md:text-lg font-bold text-stonehill-dark";

      return (
        <HTag 
          style={inlineStyles} 
          className={`font-display ${sizeClass} ${textAlignClass} mb-2`}
        >
          {content?.text}
        </HTag>
      );
    }
    case "paragraph": {
      return (
        <div 
          style={inlineStyles} 
          className={`${textAlignClass} leading-relaxed paragraph-content`}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content?.text || "") }}
        />
      );
    }
    case "image": {
      const safeImgUrl = isValidSafeUrl(content?.url) ? (content?.url || "") : "";
      const imgWidth = typeof content?.width === "string" && content.width ? content.width : undefined;
      const imgLocked = content?.lockAspectRatio !== false;
      const imgHeight = !imgLocked && typeof content?.height === "number" ? content.height : undefined;
      const imgAlign = cleanStyle.textAlign;
      const imgCornerCss = sanitizeCornerRadius(content?.cornerRadius);
      return (
        <div
          style={{
            ...inlineStyles,
            width: imgWidth,
            height: imgHeight,
            marginLeft: imgAlign === 'center' || imgAlign === 'right' ? 'auto' : undefined,
            marginRight: imgAlign === 'center' || imgAlign === 'left' ? 'auto' : undefined,
          }}
          className={`pb-resizable-media max-w-full flex flex-col ${imgAlign === 'center' ? 'items-center text-center' : imgAlign === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
        >
          {safeImgUrl ? (
            <>
              <div
                className={`overflow-hidden w-full ${imgHeight ? 'flex-1 min-h-0 flex' : ''} ${content?.shadow ? 'shadow-md' : ''}`}
                style={imgCornerCss ? { borderRadius: imgCornerCss } : undefined}
              >
                <img
                  src={safeImgUrl}
                  alt={content?.alt || ""}
                  className={`block w-full ${imgHeight ? 'h-full object-cover' : 'h-auto'}`}
                />
              </div>
              {content?.caption && (
                <p className="mt-2 text-sm text-slate-500 italic">{content.caption}</p>
              )}
            </>
          ) : (
            <div className="w-full h-48 bg-slate-100 rounded flex items-center justify-center text-slate-400">
              No Image
            </div>
          )}
        </div>
      );
    }
    case "button": {
      const safeUrl = isValidSafeUrl(content?.url) ? (content?.url || "#") : "#";
      const pad = content?.padding || {};
      const paddingStyle: React.CSSProperties = {
        paddingTop: pad.top ?? "8px",
        paddingRight: pad.right ?? "16px",
        paddingBottom: pad.bottom ?? "8px",
        paddingLeft: pad.left ?? "16px",
      };
      return (
        <div style={inlineStyles} className={`w-full flex ${cleanStyle.textAlign === 'center' ? 'justify-center' : cleanStyle.textAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
          <Button 
            variant={
              content?.variant === "secondary" ? "secondary" : 
              content?.variant === "outline" ? "outline" : 
              "default"
            } 
            size={content?.size || "md"}
            style={paddingStyle}
            asChild
          >
            <a href={safeUrl}>{content?.label || content?.text || "Click Here"}</a>
          </Button>
        </div>
      );
    }
    case "cta": {
      const safeUrl = isValidSafeUrl(content?.buttonUrl) ? (content?.buttonUrl || "#") : "#";
      return (
        <div style={inlineStyles} className={`w-full p-8 md:p-12 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 ${
            content?.background === "accent" ? "bg-stonehill-accent text-white" :
            content?.background === "light" ? "bg-stonehill-light text-stonehill-dark border border-stonehill-border" :
            "bg-stonehill-primary text-white"
          }`}>
          <div className="flex-1 text-center md:text-left">
            <h2 className={`text-2xl md:text-3xl font-display font-bold mb-2 ${content?.background === "light" ? "text-stonehill-dark" : "text-white"}`}>
              {content?.title || "Call to Action"}
            </h2>
            <p className={`font-sans text-lg ${content?.background === "light" ? "text-slate-600" : "text-white/90"}`}>
              {content?.text || "Compelling description to encourage users to click the button below."}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button 
              variant={content?.background === "light" ? "default" : "outline"}
              className={content?.background !== "light" ? "bg-white text-stonehill-primary hover:bg-slate-100 border-none" : ""}
              size="lg"
              asChild
            >
              <a href={safeUrl}>{content?.buttonLabel || content?.buttonText || "Take Action"}</a>
            </Button>
          </div>
        </div>
      );
    }
    case "video": {
      const safeUrl = isValidSafeUrl(content?.url) ? (content?.url || "") : "";
      const videoWidth = typeof content?.width === "string" && content.width ? content.width : undefined;
      const videoLocked = content?.lockAspectRatio !== false;
      const videoHeight = !videoLocked && typeof content?.height === "number" ? content.height : undefined;
      const videoAlign = cleanStyle.textAlign;
      const videoCornerCss = sanitizeCornerRadius(content?.cornerRadius);
      return (
        <div
          style={{
            ...inlineStyles,
            width: videoWidth,
            height: videoHeight,
            marginLeft: videoAlign === 'center' || videoAlign === 'right' ? 'auto' : undefined,
            marginRight: videoAlign === 'center' || videoAlign === 'left' ? 'auto' : undefined,
          }}
          className="pb-resizable-media max-w-full flex flex-col"
        >
          {safeUrl ? (
            <div
              className={`overflow-hidden w-full ${videoHeight ? 'flex-1 min-h-0' : ''}`}
              style={videoCornerCss ? { borderRadius: videoCornerCss } : undefined}
            >
              <SafeYouTubePlayer url={safeUrl} title={content?.title} fixedHeight={videoHeight} />
            </div>
          ) : (
            <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
              No Video URL Provided
            </div>
          )}
        </div>
      );
    }
    case "divider": {
      return (
        <hr 
          style={{ 
            ...inlineStyles, 
            borderColor: cleanStyle.backgroundColor || "var(--color-stonehill-light)",
            borderWidth: content?.thickness || "1px",
          }} 
          className="w-full my-4 opacity-50"
        />
      );
    }
    case "spacer": {
      return (
        <div style={{ height: content?.height || "2rem" }} aria-hidden="true" />
      );
    }
    case "card": {
      const safeUrl = isValidSafeUrl(content?.buttonUrl) ? (content?.buttonUrl || "") : "";
      const safeImgUrl = isValidSafeUrl(content?.imageUrl) ? (content?.imageUrl || "") : "";
      return (
        <Card className="h-full overflow-hidden flex flex-col" style={inlineStyles}>
          {safeImgUrl && (
            <div className="aspect-video w-full relative overflow-hidden">
              <img src={safeImgUrl} alt={content?.imageAlt || content?.title || ""} className="object-cover w-full h-full" />
            </div>
          )}
          <div className={`p-6 flex flex-col flex-1 ${textAlignClass}`}>
            {content?.title && <h3 className="text-xl font-bold mb-2 text-stonehill-primary font-display">{content.title}</h3>}
            {content?.subtitle && <h4 className="text-sm font-semibold mb-3 text-stonehill-accent uppercase tracking-wider">{content.subtitle}</h4>}
            {(content?.description || content?.text) && (
              <div 
                className="text-slate-600 mb-4 flex-1 text-sm leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.description || content.text || "") }} 
              />
            )}
            {safeUrl && (content?.buttonLabel || content?.buttonText) && (
              <div className={`mt-auto pt-4 ${cleanStyle.textAlign === 'center' ? 'flex justify-center' : cleanStyle.textAlign === 'right' ? 'flex justify-end' : 'flex justify-start'}`}>
                <Button variant={content?.buttonVariant || "outline"} size="sm" asChild>
                  <a href={safeUrl}>{content.buttonLabel || content.buttonText}</a>
                </Button>
              </div>
            )}
          </div>
        </Card>
      );
    }
    case "iconText": {
      const safeIconUrl = isValidSafeUrl(content?.iconUrl) ? (content?.iconUrl || "") : "";
      return (
        <div style={inlineStyles} className={`flex items-start gap-4 ${textAlignClass}`}>
          {(safeIconUrl || content?.icon) && (
            <div className="shrink-0 w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
              {safeIconUrl ? (
                <img src={safeIconUrl} alt="Icon" className="w-6 h-6 object-contain" />
              ) : (
                <span className="text-xl">{content.icon}</span>
              )}
            </div>
          )}
          <div>
            {content?.title && <h4 className="font-bold text-lg mb-1">{content.title}</h4>}
            {(content?.description || content?.text) && <p className="text-slate-600 leading-relaxed">{content.description || content.text}</p>}
          </div>
        </div>
      );
    }
    default:
      console.warn(`Unknown block type encountered: ${type}`);
      return null;
  }
}
