import DOMPurify from "isomorphic-dompurify";
import { PageBlock, PageBuilderSection } from "@/types/pageBuilder";

// Approved style presets
export const APPROVED_BG_COLORS = [
  "#ffffff", // White
  "#fbfaf6", // Cream / Stonehill bg
  "#1e3f66", // Stonehill Primary (navy)
  "#1c6b8d", // Stonehill Secondary (medium blue)
  "#8eb5c7", // Stonehill Light (light blue)
  "#e7ab10", // Stonehill Accent (yellow/gold)
  "transparent"
];

export const APPROVED_TEXT_COLORS = [
  "#17201d", // Dark / Stonehill text color
  "#ffffff", // White
  "#1e3f66", // Navy
  "#e7ab10", // Gold
  "inherit"
];

export const APPROVED_PADDING = [
  "py-0",
  "py-4",
  "py-6",
  "py-8",
  "py-12",
  "py-16",
  "py-24",
  "p-0",
  "p-2",
  "p-4",
  "p-6",
  "p-8",
  ""
];

export const APPROVED_MARGIN = [
  "my-0",
  "my-4",
  "my-8",
  "my-12",
  "m-0",
  "m-2",
  "m-4",
  "m-6",
  "m-8",
  ""
];

export const APPROVED_FONT_FAMILIES = ["heading", "handwritten", "sans"];

export const APPROVED_FONT_SIZES = [
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
  "text-5xl",
  "text-6xl",
  ""
];

export const APPROVED_FONT_WEIGHTS = [
  "font-light",
  "font-normal",
  "font-medium",
  "font-semibold",
  "font-bold",
  ""
];

export const APPROVED_ALIGNMENTS = ["left", "center", "right", "justify"];

/**
 * Validates whether a URL is secure/safe.
 * Safe URLs include:
 * - Internal paths: e.g., /contact, /about, /sermons (must start with / but not //)
 * - Secure external URLs: starting with https://
 * - Mailto links: e.g., mailto:info@stonehill.org (proper format)
 * - Tel links: e.g., tel:+15555555555
 * - Placeholder / empty: #, or empty string
 */
export function isValidSafeUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (trimmed === "" || trimmed === "#") return true;

  // Internal path (must start with / and not be a protocol-relative URL like //google.com)
  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//");
  }

  // Secure HTTPS URLs
  if (trimmed.startsWith("https://")) {
    return true;
  }

  // Mailto links
  if (trimmed.startsWith("mailto:")) {
    return /^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
  }

  // Telephone links
  if (trimmed.startsWith("tel:")) {
    return /^tel:[+]?[0-9\s-()]+$/.test(trimmed);
  }

  return false;
}

/**
 * Converts plain-text paragraph content (as produced by the textarea input) to
 * HTML that preserves the source's line breaks. Double newlines become a new
 * <p>, single newlines become <br>. The text is HTML-escaped first so it can
 * be safely injected via dangerouslySetInnerHTML — even content that happens
 * to contain "<script>" or HTML markup is rendered as literal text.
 */
export function formatParagraphHtml(text: string | null | undefined): string {
  if (!text) return "";
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  return text
    .split(/\n\s*\n+/)
    .map((para) => para.replace(/^\n+|\n+$/g, ""))
    .filter((para) => para.length > 0)
    .map((para) => `<p>${escape(para).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/**
 * Validates that a URL is a Google Maps embed URL. The map block iframes
 * arbitrary URLs, so we restrict the src to the official embed endpoints
 * (covered by the site's CSP frame-src for google.com / maps.google.com).
 */
export function isValidGoogleMapsEmbedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("https://www.google.com/maps/embed?") ||
    trimmed.startsWith("https://maps.google.com/maps/embed?") ||
    trimmed.startsWith("https://www.google.com/maps/embed/v1/")
  );
}

// Allow-list for CMS-authored "custom HTML" and rich-text blocks. Deliberately
// excludes script/style/iframe/object/embed/form/svg and all event-handler
// attributes — DOMPurify strips anything not on this list rather than trying
// to blocklist dangerous patterns (the previous regex-based approach here was
// bypassable via HTML-entity-encoded attribute values, e.g. `jav&#97;script:`).
const CUSTOM_HTML_ALLOWED_TAGS = [
  "a", "abbr", "b", "blockquote", "br", "caption", "code", "div", "em",
  "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i",
  "img", "li", "ol", "p", "pre", "small", "span", "strong", "sub", "sup",
  "table", "tbody", "td", "th", "thead", "tr", "u", "ul",
];

const CUSTOM_HTML_ALLOWED_ATTR = [
  "href", "src", "alt", "title", "class", "target", "rel",
  "colspan", "rowspan", "width", "height",
];

/**
 * Sanitizes CMS-authored HTML before it is injected via
 * `dangerouslySetInnerHTML`. Uses DOMPurify against an explicit tag/attribute
 * allow-list rather than trying to blocklist dangerous patterns.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: CUSTOM_HTML_ALLOWED_TAGS,
    ALLOWED_ATTR: CUSTOM_HTML_ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  }).toString();
}

/**
 * Validates and filters block and section styles to restrict them strictly to approved presets,
 * preventing arbitrary inline style injection.
 */
export function sanitizeStyle(style: any, isBlock = false): any {
  if (!style) return undefined;
  const clean: any = {};
  
  if (style.padding && APPROVED_PADDING.includes(style.padding)) {
    clean.padding = style.padding;
  }
  // Per-side padding (clamped 0..500) and margin (clamped -500..500). Same
  // shape applies for the desktop + tablet + mobile variants.
  const cleanPaddingObject = (raw: unknown, allowNegative: boolean): Record<string, unknown> | undefined => {
    if (!raw || typeof raw !== "object") return undefined;
    const obj = raw as Record<string, unknown>;
    const lo = allowNegative ? -500 : 0;
    const clamp = (n: unknown): number | undefined => {
      if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
      return Math.max(lo, Math.min(500, n));
    };
    const top = clamp(obj.top);
    const right = clamp(obj.right);
    const bottom = clamp(obj.bottom);
    const left = clamp(obj.left);
    if (top === undefined || right === undefined || bottom === undefined || left === undefined) {
      return undefined;
    }
    const unit = ["px", "rem", "%"].includes(obj.unit as string) ? (obj.unit as string) : "px";
    const next: Record<string, unknown> = { top, right, bottom, left, unit };
    if (obj.linked === true) next.linked = true;
    if (["xs", "sm", "md", "lg", "xl"].includes(obj.token as string)) {
      next.token = obj.token;
    }
    return next;
  };
  for (const field of [
    "paddingValues",
    "paddingValuesTablet",
    "paddingValuesMobile",
  ] as const) {
    const v = cleanPaddingObject(style[field], false);
    if (v) clean[field] = v;
  }
  if (style.margin && APPROVED_MARGIN.includes(style.margin)) {
    clean.margin = style.margin;
  }
  for (const field of [
    "marginValues",
    "marginValuesTablet",
    "marginValuesMobile",
  ] as const) {
    const v = cleanPaddingObject(style[field], true);
    if (v) clean[field] = v;
  }
  if (style.backgroundColor && APPROVED_BG_COLORS.includes(style.backgroundColor)) {
    clean.backgroundColor = style.backgroundColor;
  }
  if (style.textColor && APPROVED_TEXT_COLORS.includes(style.textColor)) {
    clean.textColor = style.textColor;
  }
  if (style.textAlign && APPROVED_ALIGNMENTS.includes(style.textAlign)) {
    clean.textAlign = style.textAlign;
  }
  
  if (isBlock) {
    if (style.fontSize && APPROVED_FONT_SIZES.includes(style.fontSize)) {
      clean.fontSize = style.fontSize;
    }
    if (style.fontWeight && APPROVED_FONT_WEIGHTS.includes(style.fontWeight)) {
      clean.fontWeight = style.fontWeight;
    }
    if (style.fontFamily && APPROVED_FONT_FAMILIES.includes(style.fontFamily)) {
      clean.fontFamily = style.fontFamily;
    }
  } else {
    // Section specific styles
    if (style.layoutWidth === "full" || style.layoutWidth === "content") {
      clean.layoutWidth = style.layoutWidth;
    }
    if (style.verticalSpacing) {
      clean.verticalSpacing = style.verticalSpacing;
    }
    if (style.mobileStacking) {
      clean.mobileStacking = style.mobileStacking;
    }
    if (["start", "center", "end", "stretch"].includes(style.alignItems)) {
      clean.alignItems = style.alignItems;
    }
    if (["none", "color", "image", "gradient"].includes(style.backgroundType)) {
      clean.backgroundType = style.backgroundType;
    }
    // Background image + rendering controls.
    if (typeof style.backgroundImage === "string" && isValidSafeUrl(style.backgroundImage)) {
      clean.backgroundImage = style.backgroundImage;
    }
    if (
      style.backgroundGradient &&
      typeof style.backgroundGradient.from === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(style.backgroundGradient.from) &&
      typeof style.backgroundGradient.to === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(style.backgroundGradient.to) &&
      typeof style.backgroundGradient.angle === "number" &&
      Number.isFinite(style.backgroundGradient.angle) &&
      style.backgroundGradient.angle >= 0 &&
      style.backgroundGradient.angle <= 360
    ) {
      clean.backgroundGradient = {
        from: style.backgroundGradient.from,
        to: style.backgroundGradient.to,
        angle: style.backgroundGradient.angle,
      };
    }
    if (
      [
        "center center",
        "top center",
        "bottom center",
        "left center",
        "right center",
        "top left",
        "top right",
        "bottom left",
        "bottom right",
      ].includes(style.backgroundPosition)
    ) {
      clean.backgroundPosition = style.backgroundPosition;
    }
    if (["cover", "contain", "auto"].includes(style.backgroundSize)) {
      clean.backgroundSize = style.backgroundSize;
    }
    if (["no-repeat", "repeat", "repeat-x", "repeat-y"].includes(style.backgroundRepeat)) {
      clean.backgroundRepeat = style.backgroundRepeat;
    }
    if (["scroll", "fixed"].includes(style.backgroundAttachment)) {
      clean.backgroundAttachment = style.backgroundAttachment;
    }
    if (
      typeof style.overlayColor === "string" &&
      /^#[0-9a-fA-F]{6}$/.test(style.overlayColor)
    ) {
      clean.overlayColor = style.overlayColor;
    }
    if (
      typeof style.overlayOpacity === "number" &&
      Number.isFinite(style.overlayOpacity) &&
      style.overlayOpacity >= 0 &&
      style.overlayOpacity <= 1
    ) {
      clean.overlayOpacity = style.overlayOpacity;
    }
  }
  return clean;
}

const CORNER_VALUE_RE = /^\d{1,4}(\.\d{1,2})?(px|%|rem|em)?$/;

/**
 * Validates per-corner border-radius values and returns a CSS `border-radius`
 * shorthand (top-left top-right bottom-right bottom-left), or undefined when no
 * radius object is configured. Each value is restricted to a safe numeric
 * length so an arbitrary string can never reach an inline style. A bare number
 * is treated as pixels; anything invalid collapses to 0.
 */
export function sanitizeCornerRadius(
  cornerRadius: { tl?: unknown; tr?: unknown; br?: unknown; bl?: unknown } | null | undefined,
): string | undefined {
  if (!cornerRadius || typeof cornerRadius !== "object") return undefined;

  const corner = (value: unknown): string => {
    if (typeof value !== "string") return "0";
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "0") return "0";
    if (!CORNER_VALUE_RE.test(trimmed)) return "0";
    return /^[\d.]+$/.test(trimmed) ? `${trimmed}px` : trimmed;
  };

  return [
    corner(cornerRadius.tl),
    corner(cornerRadius.tr),
    corner(cornerRadius.br),
    corner(cornerRadius.bl),
  ].join(" ");
}

/**
 * Recursively filters and sanitizes all styles throughout the page builder document.
 */
function sanitizeColumns(cols: PageBuilderSection["columns"]) {
  return cols?.map((col) => {
    const cleanCol = { ...col };
    if (cleanCol.style) {
      cleanCol.style = sanitizeStyle(cleanCol.style, false);
    }
    if (cleanCol.blocks) {
      cleanCol.blocks = cleanCol.blocks.map((blk) => {
        const cleanBlk = { ...blk };
        if (cleanBlk.style) {
          cleanBlk.style = sanitizeStyle(cleanBlk.style, true);
        }
        return cleanBlk;
      });
    }
    return cleanCol;
  });
}

export function sanitizeDocumentStyles(sections: PageBuilderSection[]): PageBuilderSection[] {
  if (!sections || !Array.isArray(sections)) return [];

  return sections.map((sec) => {
    const cleanSec = { ...sec };
    if (cleanSec.style) {
      cleanSec.style = sanitizeStyle(cleanSec.style, false);
    }
    if (cleanSec.blocks) {
      cleanSec.blocks = cleanSec.blocks.map((blk) => {
        const cleanBlk = { ...blk };
        if (cleanBlk.style) {
          cleanBlk.style = sanitizeStyle(cleanBlk.style, true);
        }
        return cleanBlk;
      });
    }
    if (cleanSec.columns) {
      cleanSec.columns = sanitizeColumns(cleanSec.columns);
    }
    if (cleanSec.rows) {
      cleanSec.rows = cleanSec.rows.map((row) => {
        const cleanRow = { ...row };
        if (cleanRow.style) {
          cleanRow.style = sanitizeStyle(cleanRow.style, false);
        }
        if (cleanRow.columns) {
          cleanRow.columns = sanitizeColumns(cleanRow.columns) || [];
        }
        return cleanRow;
      });
    }
    return cleanSec;
  });
}

/**
 * Returns a list of validation error messages for any unsafe URLs found in the page builder document.
 */
export function getUnsafeUrlsInDocument(sections: PageBuilderSection[]): string[] {
  const unsafeUrls: string[] = [];
  if (!sections || !Array.isArray(sections)) return [];
  
  const validateUrl = (url: string | null | undefined, location: string) => {
    if (url && url !== "#" && !isValidSafeUrl(url)) {
      unsafeUrls.push(`${location}: "${url}"`);
    }
  };

  sections.forEach((section, sIdx) => {
    const sName = `Section ${sIdx + 1}`;
    
    // Check blocks in section
    section.blocks?.forEach((block, bIdx) => {
      const bName = `${sName} > Block ${bIdx + 1} (${block.type})`;
      if (block.type === "button") {
        validateUrl(block.content.url, bName);
      } else if (block.type === "video") {
        validateUrl(block.content.url, bName);
      } else if (block.type === "card") {
        validateUrl(block.content.buttonUrl, bName);
        validateUrl(block.content.imageUrl, bName);
      } else if (block.type === "cta") {
        validateUrl(block.content.buttonUrl, bName);
        validateUrl(block.content.backgroundImage, bName);
      } else if (block.type === "image") {
        validateUrl(block.content.url, bName);
      } else if (block.type === "iconBox") {
        validateUrl(block.content.url, bName);
        validateUrl(block.content.iconUrl, bName);
      } else if (block.type === "googleMap") {
        const embedUrl = block.content?.embedUrl;
        if (embedUrl && !isValidGoogleMapsEmbedUrl(embedUrl)) {
          unsafeUrls.push(`${bName}: "${embedUrl}" is not a Google Maps embed URL`);
        }
      } else if (block.type === "gallery" || block.type === "carousel") {
        const images = Array.isArray(block.content?.images) ? block.content.images : [];
        images.forEach((img: { url?: string }, i: number) => {
          if (img && typeof img === "object") {
            validateUrl(img.url, `${bName} > image ${i + 1}`);
          }
        });
      }
    });

    const validateBlock = (block: PageBlock, location: string) => {
      if (block.type === "button") {
        validateUrl(block.content.url, location);
      } else if (block.type === "video") {
        validateUrl(block.content.url, location);
      } else if (block.type === "card") {
        validateUrl(block.content.buttonUrl, location);
        validateUrl(block.content.imageUrl, location);
      } else if (block.type === "cta") {
        validateUrl(block.content.buttonUrl, location);
        validateUrl(block.content.backgroundImage, location);
      } else if (block.type === "image") {
        validateUrl(block.content.url, location);
      } else if (block.type === "iconBox") {
        validateUrl(block.content.url, location);
        validateUrl(block.content.iconUrl, location);
      } else if (block.type === "googleMap") {
        const embedUrl = block.content?.embedUrl;
        if (embedUrl && !isValidGoogleMapsEmbedUrl(embedUrl)) {
          unsafeUrls.push(`${location}: "${embedUrl}" is not a Google Maps embed URL`);
        }
      } else if (block.type === "gallery" || block.type === "carousel") {
        const images = Array.isArray(block.content?.images) ? block.content.images : [];
        images.forEach((img: { url?: string }, i: number) => {
          if (img && typeof img === "object") {
            validateUrl(img.url, `${location} > image ${i + 1}`);
          }
        });
      }
    };

    // Check blocks in legacy section.columns
    section.columns?.forEach((column, cIdx) => {
      const cName = `${sName} > Column ${cIdx + 1}`;
      column.blocks?.forEach((block, bIdx) => {
        validateBlock(block, `${cName} > Block ${bIdx + 1} (${block.type})`);
      });
    });

    // Check blocks in rows[].columns[]
    section.rows?.forEach((row, rIdx) => {
      const rName = `${sName} > Row ${rIdx + 1}`;
      row.columns?.forEach((column, cIdx) => {
        const cName = `${rName} > Column ${cIdx + 1}`;
        column.blocks?.forEach((block, bIdx) => {
          validateBlock(block, `${cName} > Block ${bIdx + 1} (${block.type})`);
        });
      });
    });
  });

  return unsafeUrls;
}
