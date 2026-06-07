export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "button"
  | "video"
  | "divider"
  | "spacer"
  | "card"
  | "iconText"
  | "iconBox"
  | "googleMap"
  | "gallery"
  | "carousel"
  | "countdown"
  | "cta";

export type BlockStyle = {
  // Common styling props
  padding?: string;
  // Per-side padding override (used primarily by columns). When set, takes
  // precedence over the legacy `padding` class-name string on the renderer.
  // Tablet/Mobile variants are applied via media queries and fall back to
  // desktop when not set.
  paddingValues?: StructuredPadding;
  paddingValuesTablet?: StructuredPadding;
  paddingValuesMobile?: StructuredPadding;
  margin?: string;
  marginValues?: StructuredMargin;
  marginValuesTablet?: StructuredMargin;
  marginValuesMobile?: StructuredMargin;
  textAlign?: "left" | "center" | "right" | "justify";
  textColor?: string;
  backgroundColor?: string;
  // Specific to some blocks
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
};

export type PageBlock = {
  id: string; // Unique ID for the block instance
  type: BlockType;
  content: any; // Block specific content (e.g., text for heading, url for image)
  style?: BlockStyle;
};

export type PageColumn = {
  id: string;
  blocks: PageBlock[];
  width?: string; // e.g., "1/2", "1/3", "full", "auto"
  style?: BlockStyle;
};

export type SectionType = "section" | "row" | "columns" | "group";

export type BackgroundPosition =
  | "center center"
  | "top center"
  | "bottom center"
  | "left center"
  | "right center"
  | "top left"
  | "top right"
  | "bottom left"
  | "bottom right";

export type BackgroundSize = "cover" | "contain" | "auto";
export type BackgroundRepeat = "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
export type BackgroundAttachment = "scroll" | "fixed";
export type BackgroundType = "none" | "color" | "image" | "gradient";

export type BackgroundGradient = {
  from: string; // "#RRGGBB"
  to: string; // "#RRGGBB"
  angle: number; // 0..360
};

export type PaddingUnit = "px" | "rem" | "%";

// Structured per-side spacing. Used for both padding (clamped 0..500) and
// margin (negative values allowed for hero overlap effects). `linked` is
// UI-only — the renderer ignores it.
export type StructuredPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  unit?: PaddingUnit;
  linked?: boolean;
};
export type StructuredMargin = StructuredPadding;

export type DevicePreview = "desktop" | "tablet" | "mobile";

export type SectionStyle = {
  padding?: string;
  // Per-side padding override. When set, takes precedence over the legacy
  // `padding` class-name string. The Tablet/Mobile variants are applied via
  // CSS media queries at render time and fall back to the desktop value
  // when not set.
  paddingValues?: StructuredPadding;
  paddingValuesTablet?: StructuredPadding;
  paddingValuesMobile?: StructuredPadding;
  margin?: string;
  // Structured per-side margin (allows negative values for overlap effects).
  marginValues?: StructuredMargin;
  marginValuesTablet?: StructuredMargin;
  marginValuesMobile?: StructuredMargin;
  // Selects which background variant is active. When undefined, the renderer
  // infers a sensible type from whichever of backgroundImage / backgroundColor
  // is set so pre-existing documents keep rendering as they did before.
  backgroundType?: BackgroundType;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundGradient?: BackgroundGradient;
  // Background image rendering controls. All optional; sensible defaults
  // (cover / center / no-repeat / scroll) are applied at render time.
  backgroundPosition?: BackgroundPosition;
  backgroundSize?: BackgroundSize;
  backgroundRepeat?: BackgroundRepeat;
  backgroundAttachment?: BackgroundAttachment;
  // Optional solid color overlay rendered above the background image but
  // below the section's content. overlayOpacity is a number from 0 to 1.
  overlayColor?: string;
  overlayOpacity?: number;
  textColor?: string;
  layoutWidth?: "full" | "content";
  verticalSpacing?: string;
  mobileStacking?: "stack" | "reverse" | "keep";
  alignItems?: "start" | "center" | "end" | "stretch";
  justifyContent?: "start" | "center" | "end" | "between" | "around";
};

export type RowLayout = "1-col" | "2-col" | "3-col" | "4-col" | "left-sidebar" | "right-sidebar";

export type PageBuilderRow = {
  id: string;
  columns: PageColumn[];
  layout?: RowLayout;
  // Rows reuse SectionStyle so editors get the same padding/background/alignment
  // controls they're used to at the section level.
  style?: SectionStyle;
};

export type PageBuilderSection = {
  id: string;
  type: SectionType;
  // Preferred shape: a section is a vertical stack of rows, each row contains
  // columns. `rows` is optional so legacy documents that store columns/blocks
  // directly on the section continue to render via the migration shim.
  rows?: PageBuilderRow[];
  // Legacy shape — still honored by readers and migrated to a single row on
  // load. New writes should populate `rows` and leave these undefined.
  columns?: PageColumn[];
  blocks?: PageBlock[];
  style?: SectionStyle;
  layout?: RowLayout;
};

export type PatternTemplate = {
  id: string;
  name: string;
  description?: string;
  category: "hero" | "about" | "feature" | "call_to_action" | "general";
  sections: PageBuilderSection[];
};

export type PageBuilderDocument = {
  version: "1.0";
  sections: PageBuilderSection[];
};
