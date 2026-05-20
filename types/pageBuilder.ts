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

export type PageBuilderSection = {
  id: string;
  type: SectionType;
  columns?: PageColumn[]; // for "columns" or "row" type
  blocks?: PageBlock[]; // for "section" or "group" type
  style?: SectionStyle;
  layout?: "1-col" | "2-col" | "3-col" | "4-col" | "left-sidebar" | "right-sidebar";
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
