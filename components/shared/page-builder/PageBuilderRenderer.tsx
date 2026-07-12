"use client";

import React from "react";
import {
  PageBuilderDocument,
  PageBuilderRow,
  PageBuilderSection,
  PageColumn,
  PageBlock,
} from "@/types/pageBuilder";
import { DEFAULT_SPACING_TOKENS, type SpacingTokens } from "@/types/settings";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { isValidSafeUrl, sanitizeHtml, sanitizeStyle, sanitizeCornerRadius, formatParagraphHtml, isValidGoogleMapsEmbedUrl } from "@/lib/pageBuilderSafety";
import { extractYouTubeVideoId, getYouTubeEmbedUrl, getYouTubeThumbnailUrl } from "@/lib/youtube";

interface PageBuilderRendererProps {
  document: PageBuilderDocument;
  /**
   * Global spacing scale. Emitted as CSS custom properties on the page-builder
   * root so any spacing value with `token` set resolves via `var(--pb-space-*)`.
   * Falls back to the system defaults when omitted, so existing call sites
   * keep working without a code change.
   */
  spacingTokens?: SpacingTokens;
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

export function PageBuilderRenderer({ document, spacingTokens }: PageBuilderRendererProps) {
  if (!document || !document.sections || !Array.isArray(document.sections)) {
    return null;
  }

  const tokens = spacingTokens ?? DEFAULT_SPACING_TOKENS;
  const responsiveCss = buildResponsiveCss(document);
  // Spacing token CSS variables — scoped to the page-builder-content root so
  // they don't leak into the rest of the site. Any spacing value with a
  // `token` set resolves via `var(--pb-space-${token})`.
  const tokenVars: React.CSSProperties = {
    ["--pb-space-xs" as any]: `${tokens.xs}px`,
    ["--pb-space-sm" as any]: `${tokens.sm}px`,
    ["--pb-space-md" as any]: `${tokens.md}px`,
    ["--pb-space-lg" as any]: `${tokens.lg}px`,
    ["--pb-space-xl" as any]: `${tokens.xl}px`,
  };

  return (
    <div className="page-builder-content" style={tokenVars}>
      {responsiveCss && (
        // One <style> block per page collects every section/row/column's
        // tablet + mobile padding/margin overrides. Selectors use the
        // [data-pb-id] attribute applied below so we never collide with
        // user-authored class names.
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: responsiveCss }}
        />
      )}
      {document.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}

// Responsive breakpoints. Match the canvas DEVICE_MAX_WIDTH in BuilderCanvas
// so the editor preview matches what visitors see.
const BREAKPOINT_TABLET_MAX = 1024;
const BREAKPOINT_MOBILE_MAX = 640;

function spacingShorthand(
  v:
    | { top: number; right: number; bottom: number; left: number; unit?: string; token?: string }
    | undefined,
): string | null {
  if (!v) return null;
  // When a global spacing token is referenced, render the CSS variable so an
  // edit in Settings → Design Tokens flows through every page automatically.
  if (v.token && ["xs", "sm", "md", "lg", "xl"].includes(v.token)) {
    const ref = `var(--pb-space-${v.token})`;
    return `${ref} ${ref} ${ref} ${ref}`;
  }
  const u = v.unit ?? "px";
  return `${v.top}${u} ${v.right}${u} ${v.bottom}${u} ${v.left}${u}`;
}

function buildResponsiveCss(document: PageBuilderDocument): string {
  type Rule = { id: string; padding?: string; margin?: string };
  const tablet: Rule[] = [];
  const mobile: Rule[] = [];

  const visit = (id: string, style: any) => {
    if (!style) return;
    const s = sanitizeStyle(style, false) || {};
    const pT = spacingShorthand(s.paddingValuesTablet);
    const pM = spacingShorthand(s.paddingValuesMobile);
    const mT = spacingShorthand(s.marginValuesTablet);
    const mM = spacingShorthand(s.marginValuesMobile);
    if (pT || mT) tablet.push({ id, padding: pT ?? undefined, margin: mT ?? undefined });
    if (pM || mM) mobile.push({ id, padding: pM ?? undefined, margin: mM ?? undefined });
  };

  const visitBlocks = (blocks: PageBlock[]) => {
    if (!blocks) return;
    for (const b of blocks) {
      if (b.type === "row" && b.content?.columns) {
        for (const col of b.content.columns) {
          visit(col.id, col.style);
          visitBlocks(col.blocks || []);
        }
      }
    }
  };

  for (const section of document.sections) {
    visit(section.id, section.style);
    if (section.rows) {
      for (const row of section.rows) {
        visit(row.id, row.style);
        for (const col of row.columns) {
          visit(col.id, col.style);
          visitBlocks(col.blocks || []);
        }
      }
    }
    if (section.columns) {
      for (const col of section.columns) {
        visit(col.id, col.style);
        visitBlocks(col.blocks || []);
      }
    }
    if (section.blocks) {
      visitBlocks(section.blocks);
    }
  }

  if (tablet.length === 0 && mobile.length === 0) return "";

  const ruleToCss = ({ id, padding, margin }: Rule) => {
    const decls: string[] = [];
    if (padding) decls.push(`padding:${padding}`);
    if (margin) decls.push(`margin:${margin}`);
    return `[data-pb-id="${cssEscape(id)}"]{${decls.join(";")}}`;
  };

  const blocks: string[] = [];
  if (tablet.length > 0) {
    blocks.push(`@media (max-width:${BREAKPOINT_TABLET_MAX}px){${tablet.map(ruleToCss).join("")}}`);
  }
  if (mobile.length > 0) {
    blocks.push(`@media (max-width:${BREAKPOINT_MOBILE_MAX}px){${mobile.map(ruleToCss).join("")}}`);
  }
  return blocks.join("");
}

// Element ids are admin-generated and already pass the `pageBuilderRowSchema`
// regex, but we still strip anything that would break out of the CSS string.
function cssEscape(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function SectionRenderer({ section }: { section: PageBuilderSection }) {
  const cleanStyle = sanitizeStyle(section.style || {}, false) || {};

  const bgFill = backgroundFillStyles(cleanStyle);
  const textColor = cleanStyle.textColor ? { color: cleanStyle.textColor } : {};
  const sectionPaddingShorthand = spacingShorthand(cleanStyle.paddingValues);
  const sectionMarginShorthand = spacingShorthand(cleanStyle.marginValues);
  const padding = sectionPaddingShorthand ? "" : (cleanStyle.padding || "py-12");
  const margin = sectionMarginShorthand ? "" : (cleanStyle.margin || "");
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

  const containerClasses = `relative overflow-hidden ${padding} ${margin}`;
  const inlineStyles: React.CSSProperties = {
    ...bgFill,
    ...textColor,
    ...(sectionPaddingShorthand ? { padding: sectionPaddingShorthand } : {}),
    ...(sectionMarginShorthand ? { margin: sectionMarginShorthand } : {}),
  };
  const overlay = backgroundOverlayStyles(cleanStyle);

  // Preferred shape: render the section as a vertical stack of rows. Legacy
  // shapes (section.columns / section.blocks) still render via the original
  // branches so older documents keep working until they're re-saved.
  const hasRows = !!section.rows && section.rows.length > 0;

  return (
    <section data-pb-id={section.id} className={containerClasses} style={inlineStyles}>
      {overlay && <div aria-hidden="true" style={overlay} className="absolute inset-0 pointer-events-none" />}
      <div className={`${layoutWidth} relative`}>
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

// Infer the active background type when the field isn't set, so documents
// from before Phase 2 keep rendering the same way (image > gradient > color).
function effectiveBackgroundType(cleanStyle: any): "none" | "color" | "image" | "gradient" {
  if (cleanStyle.backgroundType) return cleanStyle.backgroundType;
  if (cleanStyle.backgroundGradient) return "gradient";
  if (cleanStyle.backgroundImage) return "image";
  if (cleanStyle.backgroundColor) return "color";
  return "none";
}

function backgroundFillStyles(cleanStyle: any): React.CSSProperties {
  const type = effectiveBackgroundType(cleanStyle);
  if (type === "color" && cleanStyle.backgroundColor) {
    return { backgroundColor: cleanStyle.backgroundColor };
  }
  if (type === "image" && cleanStyle.backgroundImage) {
    return {
      backgroundImage: `url(${cleanStyle.backgroundImage})`,
      backgroundSize: cleanStyle.backgroundSize ?? "cover",
      backgroundPosition: cleanStyle.backgroundPosition ?? "center center",
      backgroundRepeat: cleanStyle.backgroundRepeat ?? "no-repeat",
      backgroundAttachment: cleanStyle.backgroundAttachment ?? "scroll",
    };
  }
  if (type === "gradient" && cleanStyle.backgroundGradient) {
    const g = cleanStyle.backgroundGradient;
    return { backgroundImage: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})` };
  }
  return {};
}

function paddingShorthandFromValues(
  pv:
    | { top: number; right: number; bottom: number; left: number; unit?: string; token?: string }
    | undefined,
): string | null {
  return spacingShorthand(pv);
}

function backgroundOverlayStyles(cleanStyle: any): React.CSSProperties | null {
  // Overlay is only meaningful on top of an image background — color/gradient
  // can be authored at full opacity directly via the type's own controls.
  if (effectiveBackgroundType(cleanStyle) !== "image") return null;
  const opacity = typeof cleanStyle.overlayOpacity === "number" ? cleanStyle.overlayOpacity : 0;
  if (opacity <= 0) return null;
  return {
    backgroundColor: cleanStyle.overlayColor ?? "#000000",
    opacity,
  };
}

function RowRenderer({ row }: { row: PageBuilderRow }) {
  const cleanStyle = sanitizeStyle(row.style || {}, false) || {};
  const bgFill = backgroundFillStyles(cleanStyle);
  const textColor = cleanStyle.textColor ? { color: cleanStyle.textColor } : {};
  const paddingShorthand = paddingShorthandFromValues(cleanStyle.paddingValues);
  const rowMarginShorthand = spacingShorthand(cleanStyle.marginValues);
  // When the new structured paddingValues/marginValues are set we render the
  // CSS shorthand inline and intentionally drop the legacy Tailwind class so
  // the two don't compose unexpectedly.
  const padding = paddingShorthand ? "" : (cleanStyle.padding || "");
  const margin = rowMarginShorthand ? "" : (cleanStyle.margin || "");
  const verticalSpacing = cleanStyle.verticalSpacing || "gap-6";
  const alignItems = COLUMN_ALIGN_CLASS[row.style?.alignItems || "start"];
  const justifyContent = row.style?.justifyContent ? `justify-${row.style.justifyContent}` : "";

  let flexClass = "flex flex-col md:flex-row";
  if (row.style?.mobileStacking === "reverse") flexClass = "flex flex-col-reverse md:flex-row";
  else if (row.style?.mobileStacking === "keep") flexClass = "flex flex-row";

  const overlay = backgroundOverlayStyles(cleanStyle);
  const inlineSpacing: React.CSSProperties = {
    ...(paddingShorthand ? { padding: paddingShorthand } : {}),
    ...(rowMarginShorthand ? { margin: rowMarginShorthand } : {}),
  };

  return (
    <div
      data-pb-id={row.id}
      className={`relative overflow-hidden ${padding} ${margin}`}
      style={{ ...bgFill, ...textColor, ...inlineSpacing }}
    >
      {overlay && <div aria-hidden="true" style={overlay} className="absolute inset-0 pointer-events-none" />}
      <div className={`relative w-full ${flexClass} ${verticalSpacing} ${alignItems} ${justifyContent}`}>
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
  const colPaddingShorthand = paddingShorthandFromValues(cleanStyle.paddingValues);
  const colMarginShorthand = spacingShorthand(cleanStyle.marginValues);
  // Drop the legacy Tailwind padding/margin class when the structured
  // shorthand is set, same rule the row renderer uses.
  const padding = colPaddingShorthand ? "" : (cleanStyle.padding || "");
  const margin = colMarginShorthand ? "" : (cleanStyle.margin || "");
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
    ...(colPaddingShorthand ? { padding: colPaddingShorthand } : {}),
    ...(colMarginShorthand ? { margin: colMarginShorthand } : {}),
    ...(isCustomPct ? { "--col-width": column.width } as React.CSSProperties : {}),
  };

  return (
    <div
      data-pb-id={column.id}
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

  const align = cleanStyle.textAlign || content?.alignment || "";
  const textAlignClass = align ? `text-${align}` : "";

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
          dangerouslySetInnerHTML={{ __html: formatParagraphHtml(content?.text) }}
        />
      );
    }
    case "html": {
      return (
        <div
          style={inlineStyles}
          className="custom-html-content"
          dangerouslySetInnerHTML={{ __html: content?.html || "" }}
        />
      );
    }
    case "row": {
      const cols = content?.columns || [];
      const responsive = content?.responsive || { desktop: "horizontal", tablet: "auto", mobile: "stacked" };
      const isMobileStacked = responsive.mobile !== "horizontal";
      
      const alignItems = style?.alignItems || "start";
      const alignClass =
        alignItems === "center" ? "items-center" :
        alignItems === "end" ? "items-end" :
        alignItems === "stretch" ? "items-stretch" :
        "items-start";
      
      return (
        <div style={inlineStyles} className="w-full">
          <div
            className={`flex gap-4 w-full ${alignClass} ${
              isMobileStacked ? "flex-col md:flex-row" : "flex-row"
            }`}
          >
            {cols.map((col: any, colIdx: number) => {
              const width = col.width || `${100 / cols.length}%`;
              const isResponsive = isMobileStacked;
              
              const colStyle: React.CSSProperties = {
                color: col.style?.textColor,
                backgroundColor: col.style?.backgroundColor,
                textAlign: col.style?.textAlign,
                // Margin / Padding
                padding: col.style?.padding,
                margin: col.style?.margin,
                ...(isResponsive
                  ? ({ "--col-width": width } as any)
                  : { width, flexBasis: width }),
              };
              
              return (
                <div
                  key={col.id || colIdx}
                  data-pb-id={col.id}
                  style={colStyle}
                  className={`flex-grow flex flex-col md:w-auto ${
                    isResponsive ? "responsive-col w-full md:flex-none" : "flex-none"
                  }`}
                >
                  <div className="space-y-3 flex-grow">
                    {col.blocks?.map((nestedBlock: PageBlock, nestedIdx: number) => (
                      <BlockRenderer key={nestedBlock.id || nestedIdx} block={nestedBlock} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
      const btnAlign = cleanStyle.textAlign || content?.alignment || "left";
      const justifyClass = btnAlign === "center" ? "justify-center" : btnAlign === "right" ? "justify-end" : "justify-start";
      return (
        <div style={inlineStyles} className={`w-full flex ${justifyClass}`}>
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
            <a
              href={safeUrl}
              target={content?.openInNewTab ? "_blank" : undefined}
              rel={content?.openInNewTab ? "noopener noreferrer" : undefined}
            >
              {content?.label || content?.text || "Click Here"}
            </a>
          </Button>
        </div>
      );
    }
    case "gallery": {
      const images = (Array.isArray(content?.images) ? content.images : [])
        .filter((img: { url?: string }) => img && typeof img.url === "string" && isValidSafeUrl(img.url));
      if (images.length === 0) return null;
      return <GalleryBlock images={images} content={content} inlineStyles={inlineStyles} />;
    }
    case "carousel": {
      const images = (Array.isArray(content?.images) ? content.images : [])
        .filter((img: { url?: string }) => img && typeof img.url === "string" && isValidSafeUrl(img.url));
      if (images.length === 0) return null;
      return <CarouselBlock images={images} content={content} inlineStyles={inlineStyles} />;
    }
    case "countdown": {
      return <CountdownBlock content={content} inlineStyles={inlineStyles} />;
    }
    case "cta": {
      const safeUrl = isValidSafeUrl(content?.buttonUrl) ? (content?.buttonUrl || "#") : "#";
      const safeBgImg = isValidSafeUrl(content?.backgroundImage) ? (content?.backgroundImage || "") : "";
      const padClass =
        content?.padding === "small" ? "p-6 md:p-8" :
        content?.padding === "large" ? "p-12 md:p-20" :
        "p-8 md:p-12";
      const isLight = content?.background === "light";
      const containerStyle: React.CSSProperties = { ...inlineStyles };
      if (safeBgImg) {
        containerStyle.backgroundImage = `url(${safeBgImg})`;
        containerStyle.backgroundSize = "cover";
        containerStyle.backgroundPosition = "center";
      }
      return (
        <div
          style={containerStyle}
          className={`relative w-full ${padClass} rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden ${
            safeBgImg ? "bg-stonehill-primary text-white" :
            content?.background === "accent" ? "bg-stonehill-accent text-white" :
            isLight ? "bg-stonehill-light text-stonehill-dark border border-stonehill-border" :
            "bg-stonehill-primary text-white"
          }`}
        >
          {safeBgImg && <div className="absolute inset-0 bg-black/55" aria-hidden="true" />}
          <div className="relative flex-1 text-center md:text-left">
            {content?.subheading && (
              <p className={`italic text-sm md:text-base mb-2 ${safeBgImg ? "text-stonehill-accent" : isLight ? "text-stonehill-accent" : "text-stonehill-accent"}`}>
                {content.subheading}
              </p>
            )}
            <h2 className={`text-2xl md:text-3xl font-display font-bold mb-2 ${!safeBgImg && isLight ? "text-stonehill-dark" : "text-white"}`}>
              {content?.title || "Call to Action"}
            </h2>
            <p className={`font-sans text-lg ${!safeBgImg && isLight ? "text-slate-600" : "text-white/90"}`}>
              {content?.text || "Compelling description to encourage users to click the button below."}
            </p>
          </div>
          <div className="relative flex-shrink-0">
            <Button
              variant={!safeBgImg && isLight ? "default" : "outline"}
              className={safeBgImg || !isLight ? "bg-white text-stonehill-primary hover:bg-slate-100 border-none" : ""}
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
    case "iconBox": {
      const safeIconUrl = isValidSafeUrl(content?.iconUrl) ? (content?.iconUrl || "") : "";
      const align = content?.alignment === "left" ? "items-start text-left"
        : content?.alignment === "right" ? "items-end text-right"
        : "items-center text-center";
      const HTag = (content?.level || "h3") as React.ElementType;
      const level = content?.level || "h3";
      const titleSize =
        level === "h1" ? "text-4xl md:text-5xl" :
        level === "h2" ? "text-3xl md:text-4xl" :
        level === "h3" ? "text-2xl md:text-3xl" :
        level === "h4" ? "text-xl md:text-2xl" :
        level === "h5" ? "text-lg md:text-xl" :
        "text-base md:text-lg";
      const isImage = content?.variant === "image";
      const safeLink = isValidSafeUrl(content?.url) ? (content?.url || "") : "";

      // Image styling (size, radius, shadow, border, object-fit).
      const lockAspect = content?.lockAspectRatio === true;
      const widthVal = typeof content?.imageWidth === "string" && content.imageWidth ? content.imageWidth : undefined;
      const heightVal = !lockAspect && typeof content?.imageHeight === "string" && content.imageHeight ? content.imageHeight : undefined;
      const fitVal = content?.objectFit || "cover";
      const cornerCss = sanitizeCornerRadius(content?.cornerRadius);
      const shadowClass =
        content?.shadowSize === "sm" ? "shadow-sm" :
        content?.shadowSize === "md" ? "shadow-md" :
        content?.shadowSize === "lg" ? "shadow-lg" : "";
      const wrapperStyle: React.CSSProperties = {
        width: widthVal,
        height: heightVal,
        borderRadius: cornerCss || undefined,
      };
      if (content?.border) {
        const bw = Math.max(0, Math.min(20, Number(content?.borderWidth) || 2));
        wrapperStyle.borderWidth = `${bw}px`;
        wrapperStyle.borderStyle = "solid";
        wrapperStyle.borderColor = typeof content?.borderColor === "string" ? content.borderColor : "#e7ab10";
      }
      const hasExplicitSize = !!(widthVal || heightVal);
      const defaultSizeClass = hasExplicitSize ? "" : (isImage ? "w-24 h-24" : "w-16 h-16");
      const radiusClass = cornerCss ? "" : "rounded-full";

      const inner = (
        <>
          {(safeIconUrl || content?.icon) && (
            <div
              className={`shrink-0 ${defaultSizeClass} ${!isImage ? "bg-stonehill-primary/10 text-stonehill-primary" : ""} ${shadowClass} ${radiusClass} flex items-center justify-center overflow-hidden`}
              style={wrapperStyle}
            >
              {isImage && safeIconUrl ? (
                <img
                  src={safeIconUrl}
                  alt={content?.alt || ""}
                  className={`block w-full ${lockAspect ? "h-auto" : "h-full"}`}
                  style={lockAspect ? undefined : { objectFit: fitVal }}
                />
              ) : safeIconUrl ? (
                <img src={safeIconUrl} alt="" className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-2xl">{content?.icon}</span>
              )}
            </div>
          )}
          {content?.title && <HTag className={`font-display font-bold text-stonehill-dark ${titleSize}`}>{content.title}</HTag>}
          {content?.description && <p className="text-slate-600 leading-relaxed max-w-md">{content.description}</p>}
        </>
      );
      return (
        <div style={inlineStyles} className={`flex flex-col gap-3 ${align}`}>
          {safeLink ? (
            <a
              href={safeLink}
              target={content?.openInNewTab ? "_blank" : undefined}
              rel={content?.openInNewTab ? "noopener noreferrer" : undefined}
              className={`flex flex-col gap-3 ${align} no-underline hover:opacity-90 transition-opacity`}
            >
              {inner}
            </a>
          ) : (
            inner
          )}
        </div>
      );
    }
    case "googleMap": {
      const validEmbed = !!content?.embedUrl && isValidGoogleMapsEmbedUrl(content.embedUrl);
      if (!validEmbed) return null;
      const heightPx = typeof content?.height === "number" ? Math.max(150, Math.min(1200, content.height)) : 400;
      const fullWidth = !!content?.fullWidth;
      return (
        <div style={inlineStyles} className={fullWidth ? "w-screen relative left-1/2 right-1/2 -mx-[50vw]" : "w-full"}>
          <iframe
            src={content.embedUrl}
            title="Google Map"
            className="w-full border-0 rounded-lg"
            style={{ height: `${heightPx}px` }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      );
    }
    default:
      console.warn(`Unknown block type encountered: ${type}`);
      return null;
  }
}

/* ─── Gallery ──────────────────────────────────────────────────────── */

interface GalleryImage { url: string; alt?: string; caption?: string; }

function GalleryBlock({ images, content, inlineStyles }: {
  images: GalleryImage[];
  content: any;
  inlineStyles: React.CSSProperties;
}) {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const columnsClass =
    content?.columns === 2 ? "sm:grid-cols-2 md:grid-cols-2" :
    content?.columns === 4 ? "sm:grid-cols-2 md:grid-cols-4" :
    "sm:grid-cols-2 md:grid-cols-3";
  const gutterClass = content?.gutter === "sm" ? "gap-2" : content?.gutter === "lg" ? "gap-6" : "gap-4";
  const roundedClass = content?.rounded === false ? "" : "rounded-lg";
  const lightbox = !!content?.lightbox;

  return (
    <div style={inlineStyles} className="w-full">
      <div className={`grid grid-cols-1 ${columnsClass} ${gutterClass}`}>
        {images.map((img, i) => {
          const tile = (
            <div className={`relative ${roundedClass} overflow-hidden bg-slate-100 aspect-square group`}>
              <img
                src={img.url}
                alt={img.alt || ""}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {img.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-white text-sm p-3">
                  {img.caption}
                </div>
              )}
            </div>
          );
          return lightbox ? (
            <button
              key={i}
              type="button"
              onClick={() => setOpenIndex(i)}
              className="block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent rounded-lg"
              aria-label={`Open image ${i + 1}${img.alt ? `: ${img.alt}` : ""}`}
            >
              {tile}
            </button>
          ) : (
            <div key={i}>{tile}</div>
          );
        })}
      </div>
      {lightbox && openIndex !== null && (
        <GalleryLightbox
          images={images}
          index={openIndex}
          onChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  );
}

function GalleryLightbox({ images, index, onChange, onClose }: {
  images: GalleryImage[];
  index: number;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onChange((index + 1) % images.length);
      if (e.key === "ArrowLeft") onChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, images.length, onChange, onClose]);

  const img = images[index];
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl font-light leading-none"
        aria-label="Close lightbox"
      >
        ×
      </button>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => onChange((index - 1 + images.length) % images.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl font-light leading-none"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => onChange((index + 1) % images.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white text-4xl font-light leading-none"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}
      <div className="max-w-6xl max-h-full flex flex-col items-center gap-3">
        <img src={img.url} alt={img.alt || ""} className="max-w-full max-h-[85vh] object-contain" />
        {img.caption && <p className="text-white/90 text-sm max-w-2xl text-center">{img.caption}</p>}
      </div>
    </div>
  );
}

/* ─── Carousel ─────────────────────────────────────────────────────── */

function CarouselBlock({ images, content, inlineStyles }: {
  images: Array<{ url: string; alt?: string }>;
  content: any;
  inlineStyles: React.CSSProperties;
}) {
  const [index, setIndex] = React.useState(0);
  const autoplay = content?.autoplay !== false;
  const autoplaySpeed = typeof content?.autoplaySpeedMs === "number"
    ? Math.max(1000, Math.min(20000, content.autoplaySpeedMs))
    : 5000;
  const showArrows = content?.showArrows !== false;
  const showDots = content?.showDots !== false;
  const transition = content?.transition === "fade" ? "fade" : "slide";
  const heightPx = typeof content?.height === "number" ? Math.max(160, Math.min(800, content.height)) : 480;
  const rounded = content?.rounded !== false;
  const shadow = !!content?.shadow;

  React.useEffect(() => {
    if (!autoplay || images.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % images.length), autoplaySpeed);
    return () => clearInterval(id);
  }, [autoplay, autoplaySpeed, images.length]);

  const goTo = (i: number) => setIndex(((i % images.length) + images.length) % images.length);

  return (
    <div
      style={inlineStyles}
      className={`relative w-full ${rounded ? "rounded-lg" : ""} ${shadow ? "shadow-lg" : ""} overflow-hidden bg-slate-900`}
    >
      <div className="relative" style={{ height: `${heightPx}px` }}>
        {transition === "fade" ? (
          images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.alt || ""}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
              style={{ opacity: i === index ? 1 : 0 }}
              aria-hidden={i !== index}
            />
          ))
        ) : (
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.alt || ""}
                className="w-full h-full object-cover shrink-0"
                style={{ width: "100%" }}
              />
            ))}
          </div>
        )}
      </div>

      {showArrows && images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center text-2xl leading-none transition-colors"
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center text-2xl leading-none transition-colors"
            aria-label="Next slide"
          >
            ›
          </button>
        </>
      )}

      {showDots && images.length > 1 && (
        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === index ? "bg-white scale-110" : "bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Countdown ────────────────────────────────────────────────────── */

function CountdownBlock({ content, inlineStyles }: { content: any; inlineStyles: React.CSSProperties; }) {
  const target = React.useMemo(() => {
    const v = content?.targetDateTime;
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.getTime();
  }, [content?.targetDateTime]);

  const computeRemaining = React.useCallback(() => {
    if (target === null) return 0;
    return Math.max(0, target - Date.now());
  }, [target]);

  const [remaining, setRemaining] = React.useState<number>(() => computeRemaining());

  React.useEffect(() => {
    setRemaining(computeRemaining());
    if (target === null) return;
    const id = setInterval(() => setRemaining(computeRemaining()), 1000);
    return () => clearInterval(id);
  }, [target, computeRemaining]);

  if (target === null) return null;

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const accent = typeof content?.accentColor === "string" ? content.accentColor : "#e7ab10";
  const alignClass =
    content?.alignment === "left" ? "items-start text-left" :
    content?.alignment === "right" ? "items-end text-right" :
    "items-center text-center";
  const isBoxed = content?.style !== "inline";
  const reachedZero = remaining === 0;

  const cells = [
    { value: days, label: "Days" },
    { value: hours, label: "Hours" },
    { value: minutes, label: "Min" },
    { value: seconds, label: "Sec" },
  ];

  return (
    <div style={inlineStyles} className={`flex flex-col gap-3 ${alignClass}`}>
      {content?.label && (
        <span className="text-sm md:text-base font-medium text-slate-700">{content.label}</span>
      )}
      {reachedZero ? (
        <div className="text-2xl md:text-3xl font-bold" style={{ color: accent }}>
          The wait is over!
        </div>
      ) : isBoxed ? (
        <div className="flex gap-3 flex-wrap">
          {cells.map((c) => (
            <div
              key={c.label}
              className="bg-white border border-slate-200 rounded-xl px-4 py-3 min-w-[80px] text-center shadow-sm"
            >
              <div className="text-3xl md:text-4xl font-bold tabular-nums" style={{ color: accent }}>
                {String(c.value).padStart(2, "0")}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mt-1">
                {c.label}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: accent }}>
          {days}d · {String(hours).padStart(2, "0")}h · {String(minutes).padStart(2, "0")}m · {String(seconds).padStart(2, "0")}s
        </div>
      )}
    </div>
  );
}
