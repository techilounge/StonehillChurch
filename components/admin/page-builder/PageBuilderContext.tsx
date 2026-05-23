"use client";

import * as React from "react";
import { PageContent } from "@/types/content";
import { PageBuilderSection, PageBlock, PageColumn, PatternTemplate } from "@/types/pageBuilder";

interface PageBuilderContextType {
  formData: Partial<PageContent>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<PageContent>>>;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  
  // Actions
  handleAddSection: () => void;
  handleRemoveSection: (id: string) => void;
  handleReorderSections: (oldIndex: number, newIndex: number) => void;
  handleDuplicateSection: (id: string) => void;
  handleUpdateSection: (id: string, updates: Partial<PageBuilderSection>) => void;
  handleChangeSectionLayout: (id: string, newLayout: NonNullable<PageBuilderSection["layout"]>) => void;
  
  handleAddBlock: (sectionId: string, blockType: PageBlock["type"], columnId?: string) => void;
  handleRemoveBlock: (sectionId: string, blockId: string, columnId?: string) => void;
  handleUpdateBlock: (sectionId: string, blockId: string, updates: Partial<PageBlock>, columnId?: string) => void;
  handleReorderBlocks: (sectionId: string, oldIndex: number, newIndex: number, columnId?: string) => void;
  
  handleInsertTemplate: (template: PatternTemplate) => void;
}

export const PageBuilderContext = React.createContext<PageBuilderContextType | null>(null);

export function usePageBuilder() {
  const context = React.useContext(PageBuilderContext);
  if (!context) {
    throw new Error("usePageBuilder must be used within a PageBuilderProvider");
  }
  return context;
}

export function PageBuilderProvider({ 
  children, 
  initialData 
}: { 
  children: React.ReactNode; 
  initialData: Partial<PageContent>;
}) {
  const [formData, setFormData] = React.useState<Partial<PageContent>>(initialData);
  const [selectedElementId, setSelectedElementId] = React.useState<string | null>(null);

  const builderData = formData.builderData || { version: "1.0", sections: [] };

  const handleAddSection = () => {
    const newSection: PageBuilderSection = {
      id: `sec_${Date.now()}`,
      type: "section",
      style: {
        padding: "py-12",
        backgroundColor: "#ffffff",
      },
      blocks: [],
    };
    
    setFormData((prev) => {
      const currentBuilderData = prev.builderData || { version: "1.0", sections: [] };
      return {
        ...prev,
        builderData: {
          ...currentBuilderData,
          sections: [...currentBuilderData.sections, newSection],
        },
      };
    });
    setSelectedElementId(newSection.id);
  };

  const handleRemoveSection = (id: string) => {
    setFormData((prev) => {
      const currentBuilderData = prev.builderData || { version: "1.0", sections: [] };
      return {
        ...prev,
        builderData: {
          ...currentBuilderData,
          sections: currentBuilderData.sections.filter((s) => s.id !== id),
        },
      };
    });
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleReorderSections = (oldIndex: number, newIndex: number) => {
    setFormData((prev) => {
      const currentBuilderData = prev.builderData || { version: "1.0", sections: [] };
      const sections = [...currentBuilderData.sections];
      const [movedSection] = sections.splice(oldIndex, 1);
      sections.splice(newIndex, 0, movedSection);
      return {
        ...prev,
        builderData: {
          ...currentBuilderData,
          sections,
        },
      };
    });
  };

  const handleDuplicateSection = (id: string) => {
    setFormData((prev) => {
      const currentBuilderData = prev.builderData || { version: "1.0", sections: [] };
      const sections = [...currentBuilderData.sections];
      const index = sections.findIndex((s) => s.id === id);
      if (index === -1) return prev;

      // Deep clone the section and generate new IDs
      const sectionToDuplicate = sections[index];
      const duplicateSection: PageBuilderSection = {
        ...JSON.parse(JSON.stringify(sectionToDuplicate)),
        id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      };
      
      // Regenerate IDs for blocks inside
      if (duplicateSection.blocks) {
        duplicateSection.blocks = duplicateSection.blocks.map(b => ({
          ...b,
          id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
        }));
      }
      
      if (duplicateSection.columns) {
         duplicateSection.columns = duplicateSection.columns.map(col => ({
             ...col,
             id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
             blocks: col.blocks.map(b => ({
                 ...b,
                 id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
             }))
         }));
      }

      sections.splice(index + 1, 0, duplicateSection);
      return {
        ...prev,
        builderData: {
          ...currentBuilderData,
          sections,
        },
      };
    });
  };

  const handleUpdateSection = (id: string, updates: Partial<PageBuilderSection>) => {
    setFormData((prev) => {
      const currentBuilderData = prev.builderData || { version: "1.0", sections: [] };
      return {
        ...prev,
        builderData: {
          ...currentBuilderData,
          sections: currentBuilderData.sections.map(s => s.id === id ? { ...s, ...updates } : s),
        },
      };
    });
  };

  const handleChangeSectionLayout = (id: string, newLayout: NonNullable<PageBuilderSection["layout"]>) => {
    setFormData((prev) => {
      const currentBuilderData = prev.builderData || { version: "1.0", sections: [] };
      return {
        ...prev,
        builderData: {
          ...currentBuilderData,
          sections: currentBuilderData.sections.map(s =>
            s.id === id ? { ...s, ...convertSectionLayout(s, newLayout) } : s
          ),
        },
      };
    });
  };

  const handleAddBlock = (sectionId: string, blockType: PageBlock["type"], columnId?: string) => {
    const newBlock: PageBlock = {
      id: `blk_${Date.now()}`,
      type: blockType,
      content: getInitialBlockContent(blockType),
    };
    
    setFormData((prev) => {
      const currentBuilderData = prev.builderData || { version: "1.0", sections: [] };
      return {
        ...prev,
        builderData: {
          ...currentBuilderData,
          sections: currentBuilderData.sections.map(s => {
            if (s.id === sectionId) {
              if (columnId && s.columns) {
                return {
                  ...s,
                  columns: s.columns.map(col => {
                    if (col.id === columnId) {
                      return { ...col, blocks: [...(col.blocks || []), newBlock] };
                    }
                    return col;
                  })
                };
              }
              return { ...s, blocks: [...(s.blocks || []), newBlock] };
            }
            return s;
          }),
        },
      };
    });
    setSelectedElementId(newBlock.id);
  };

  const handleRemoveBlock = (sectionId: string, blockId: string, columnId?: string) => {
    setFormData((prev) => {
      const currentBuilderData = prev.builderData || { version: "1.0", sections: [] };
      return {
        ...prev,
        builderData: {
          ...currentBuilderData,
          sections: currentBuilderData.sections.map(s => {
            if (s.id === sectionId) {
              if (columnId && s.columns) {
                return {
                  ...s,
                  columns: s.columns.map(col => {
                    if (col.id === columnId) {
                      return { ...col, blocks: (col.blocks || []).filter(b => b.id !== blockId) };
                    }
                    return col;
                  })
                };
              }
              return { ...s, blocks: (s.blocks || []).filter(b => b.id !== blockId) };
            }
            return s;
          }),
        },
      };
    });
    if (selectedElementId === blockId) setSelectedElementId(sectionId);
  };

  const handleUpdateBlock = (sectionId: string, blockId: string, updates: Partial<PageBlock>, columnId?: string) => {
    setFormData((prev) => {
      const currentBuilderData = prev.builderData || { version: "1.0", sections: [] };
      return {
        ...prev,
        builderData: {
          ...currentBuilderData,
          sections: currentBuilderData.sections.map(s => {
            if (s.id === sectionId) {
              if (columnId && s.columns) {
                return {
                  ...s,
                  columns: s.columns.map(col => {
                    if (col.id === columnId) {
                      return {
                        ...col,
                        blocks: (col.blocks || []).map(b => b.id === blockId ? { ...b, ...updates } : b),
                      };
                    }
                    return col;
                  })
                };
              }
              return {
                ...s,
                blocks: (s.blocks || []).map(b => b.id === blockId ? { ...b, ...updates } : b),
              };
            }
            return s;
          }),
        },
      };
    });
  };

  const handleReorderBlocks = (sectionId: string, oldIndex: number, newIndex: number, columnId?: string) => {
    setFormData((prev) => {
      const currentBuilderData = prev.builderData || { version: "1.0", sections: [] };
      return {
        ...prev,
        builderData: {
          ...currentBuilderData,
          sections: currentBuilderData.sections.map(s => {
            if (s.id === sectionId) {
              if (columnId && s.columns) {
                return {
                  ...s,
                  columns: s.columns.map(col => {
                    if (col.id === columnId && col.blocks) {
                      const blocks = [...col.blocks];
                      const [movedBlock] = blocks.splice(oldIndex, 1);
                      blocks.splice(newIndex, 0, movedBlock);
                      return { ...col, blocks };
                    }
                    return col;
                  })
                };
              }
              if (s.blocks) {
                const blocks = [...s.blocks];
                const [movedBlock] = blocks.splice(oldIndex, 1);
                blocks.splice(newIndex, 0, movedBlock);
                return { ...s, blocks };
              }
            }
            return s;
          }),
        },
      };
    });
  };

  const handleInsertTemplate = (template: PatternTemplate) => {
    setFormData((prev) => {
      const currentBuilderData = prev.builderData || { version: "1.0", sections: [] };
      const sections = [...currentBuilderData.sections];
      
      const newSections = template.sections.map(section => {
        const clonedSection: PageBuilderSection = {
          ...JSON.parse(JSON.stringify(section)),
          id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        };
        
        if (clonedSection.blocks) {
          clonedSection.blocks = clonedSection.blocks.map(b => ({
            ...b,
            id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          }));
        }
        
        if (clonedSection.columns) {
           clonedSection.columns = clonedSection.columns.map(col => ({
               ...col,
               id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
               blocks: col.blocks.map(b => ({
                   ...b,
                   id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
               }))
           }));
        }
        return clonedSection;
      });

      return {
        ...prev,
        builderData: {
          ...currentBuilderData,
          sections: [...sections, ...newSections],
        },
      };
    });
  };

  return (
    <PageBuilderContext.Provider value={{
      formData,
      setFormData,
      selectedElementId,
      setSelectedElementId,
      handleAddSection,
      handleRemoveSection,
      handleReorderSections,
      handleDuplicateSection,
      handleUpdateSection,
      handleChangeSectionLayout,
      handleAddBlock,
      handleRemoveBlock,
      handleUpdateBlock,
      handleReorderBlocks,
      handleInsertTemplate,
    }}>
      {children}
    </PageBuilderContext.Provider>
  );
}

/** Per-column width presets for each layout option, in % strings. */
const LAYOUT_COLUMN_WIDTHS: Record<NonNullable<PageBuilderSection["layout"]>, string[]> = {
  "1-col": ["100%"],
  "2-col": ["50%", "50%"],
  "3-col": ["33.33%", "33.33%", "33.34%"],
  "4-col": ["25%", "25%", "25%", "25%"],
  "left-sidebar": ["25%", "75%"],
  "right-sidebar": ["75%", "25%"],
};

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Converts a section between the single-column (blocks) model and the
 * multi-column (columns) model so that resizable column separators render
 * consistently. The columns model is the only one able to store per-column
 * widths, which the drag-to-resize controls depend on.
 */
function convertSectionLayout(
  section: PageBuilderSection,
  newLayout: NonNullable<PageBuilderSection["layout"]>
): Partial<PageBuilderSection> {
  const widths = LAYOUT_COLUMN_WIDTHS[newLayout] || ["100%"];
  const columnCount = widths.length;
  const existingColumns = section.columns && section.columns.length > 0 ? section.columns : null;

  // Single column: flatten any existing columns back into one blocks list.
  if (columnCount === 1) {
    const flatBlocks = existingColumns
      ? existingColumns.flatMap(c => c.blocks || [])
      : section.blocks || [];
    return { type: "section", layout: "1-col", blocks: flatBlocks, columns: undefined };
  }

  // Multi-column: build a columns array, reusing existing columns where possible.
  const sourceColumns: PageColumn[] = existingColumns
    ? existingColumns
    : [{ id: genId("col"), blocks: section.blocks || [] }];

  const newColumns: PageColumn[] = [];
  for (let i = 0; i < columnCount; i++) {
    const source = sourceColumns[i];
    newColumns.push({
      id: source?.id || genId("col"),
      style: source?.style,
      blocks: source?.blocks || [],
      width: widths[i],
    });
  }

  // When reducing column count, keep orphaned blocks by merging them into the last column.
  if (sourceColumns.length > columnCount) {
    const orphaned = sourceColumns.slice(columnCount).flatMap(c => c.blocks || []);
    const last = newColumns[columnCount - 1];
    newColumns[columnCount - 1] = { ...last, blocks: [...last.blocks, ...orphaned] };
  }

  return { type: "columns", layout: newLayout, columns: newColumns, blocks: undefined };
}

function getInitialBlockContent(type: PageBlock["type"]) {
  switch (type) {
    case "heading": return { text: "Heading Text", level: "h2", alignment: "left", variant: "default" };
    case "paragraph": return { text: "Add your text here...", alignment: "left", maxWidth: "full" };
    case "image": return { url: "", alt: "", caption: "", alignment: "center", widthStyle: "full" };
    case "button": return { 
      label: "Click Here", 
      url: "#", 
      variant: "primary", 
      alignment: "left",
      padding: {
        top: "8px",
        right: "16px",
        bottom: "8px",
        left: "16px"
      },
      paddingLinked: false
    };
    case "video": return { url: "", title: "Video Player", thumbnailFirst: false };
    case "divider": return { thickness: 1, color: "slate-200", spacing: "py-4" };
    case "spacer": return { heightDesktop: "h-8", heightMobile: "h-4" };
    case "card": return { title: "Card Title", description: "Card description", imageUrl: "", buttonLabel: "", buttonUrl: "" };
    case "iconText": return { icon: "star", title: "Feature", description: "Details here" };
    case "cta": return { title: "Call to action", text: "Join us today and make a difference.", buttonLabel: "Action", buttonUrl: "#", backgroundStyle: "navy" };
    default: return {};
  }
}
