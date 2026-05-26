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
  | "cta";

export type BlockStyle = {
  // Common styling props
  padding?: string;
  margin?: string;
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

export type SectionStyle = {
  padding?: string;
  margin?: string;
  backgroundColor?: string;
  backgroundImage?: string;
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
