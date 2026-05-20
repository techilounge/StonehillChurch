import { PageBuilderSection } from "@/types/pageBuilder";

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
 * Strips script tags, unsafe onload/onerror handlers, iframe/object tags, and javascript: links to prevent script injection.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  
  // Remove script tags and their contents
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Remove onmouseover, onload, onerror, etc. attributes
  clean = clean.replace(/on\w+\s*=\s*(['"])(.*?)\1/gi, "");
  clean = clean.replace(/on\w+\s*=\s*([^>\s]+)/gi, "");
  
  // Remove javascript: and data: URLs inside href or src
  clean = clean.replace(/(href|src)\s*=\s*(['"])\s*(javascript|data):.*?\2/gi, '$1="#"');
  
  // Remove iframe/object/embed/applet tags to prevent external execution
  clean = clean.replace(/<(iframe|object|embed|applet)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, "");
  clean = clean.replace(/<(iframe|object|embed|applet)[^>]*>/gi, "");
  
  return clean;
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
  if (style.margin && APPROVED_MARGIN.includes(style.margin)) {
    clean.margin = style.margin;
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
export function sanitizeDocumentStyles(sections: PageBuilderSection[]): PageBuilderSection[] {
  if (!sections || !Array.isArray(sections)) return [];
  
  return sections.map(sec => {
    const cleanSec = { ...sec };
    if (cleanSec.style) {
      cleanSec.style = sanitizeStyle(cleanSec.style, false);
    }
    if (cleanSec.blocks) {
      cleanSec.blocks = cleanSec.blocks.map(blk => {
        const cleanBlk = { ...blk };
        if (cleanBlk.style) {
          cleanBlk.style = sanitizeStyle(cleanBlk.style, true);
        }
        return cleanBlk;
      });
    }
    if (cleanSec.columns) {
      cleanSec.columns = cleanSec.columns.map(col => {
        const cleanCol = { ...col };
        if (cleanCol.style) {
          cleanCol.style = sanitizeStyle(cleanCol.style, false);
        }
        if (cleanCol.blocks) {
          cleanCol.blocks = cleanCol.blocks.map(blk => {
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
      } else if (block.type === "image") {
        validateUrl(block.content.url, bName);
      }
    });

    // Check blocks in columns
    section.columns?.forEach((column, cIdx) => {
      const cName = `${sName} > Column ${cIdx + 1}`;
      column.blocks?.forEach((block, bIdx) => {
        const bName = `${cName} > Block ${bIdx + 1} (${block.type})`;
        if (block.type === "button") {
          validateUrl(block.content.url, bName);
        } else if (block.type === "video") {
          validateUrl(block.content.url, bName);
        } else if (block.type === "card") {
          validateUrl(block.content.buttonUrl, bName);
          validateUrl(block.content.imageUrl, bName);
        } else if (block.type === "cta") {
          validateUrl(block.content.buttonUrl, bName);
        } else if (block.type === "image") {
          validateUrl(block.content.url, bName);
        }
      });
    });
  });

  return unsafeUrls;
}
