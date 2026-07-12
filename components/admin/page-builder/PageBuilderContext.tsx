"use client";

import * as React from "react";
import { PageContent, Ministry } from "@/types/content";
import {
  DevicePreview,
  PageBlock,
  PageBuilderDocument,
  PageBuilderRow,
  PageBuilderSection,
  PageColumn,
  PatternTemplate,
  RowLayout,
  RowBlockColumn,
} from "@/types/pageBuilder";
import { DEFAULT_SPACING_TOKENS, type SpacingTokens } from "@/types/settings";
import {
  convertRowLayout,
  ensureSectionUsesRows,
  makeEmptyRow,
} from "@/lib/page-builder-rows";

interface PageBuilderContextType {
  formData: Partial<PageContent & Ministry>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<PageContent & Ministry>>>;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;

  // Active device for the responsive padding/margin controls and the canvas
  // preview width. Drives which value-field the spacing controls read/write.
  devicePreview: DevicePreview;
  setDevicePreview: (device: DevicePreview) => void;

  // Global spacing tokens (XS/SM/MD/LG/XL) used to render token-mode spacing
  // values. Provided by PageBuilderShell from server-side site settings.
  spacingTokens: SpacingTokens;

  // Section actions
  handleAddSection: () => void;
  handleRemoveSection: (id: string) => void;
  handleReorderSections: (oldIndex: number, newIndex: number) => void;
  handleDuplicateSection: (id: string) => void;
  handleUpdateSection: (id: string, updates: Partial<PageBuilderSection>) => void;
  handleChangeSectionLayout: (id: string, newLayout: RowLayout) => void;

  // Row actions
  handleAddRow: (sectionId: string) => void;
  handleRemoveRow: (sectionId: string, rowId: string) => void;
  handleDuplicateRow: (sectionId: string, rowId: string) => void;
  handleReorderRows: (sectionId: string, oldIndex: number, newIndex: number) => void;
  handleUpdateRow: (sectionId: string, rowId: string, updates: Partial<PageBuilderRow>) => void;
  handleChangeRowLayout: (sectionId: string, rowId: string, newLayout: RowLayout) => void;

  // Column actions
  handleUpdateColumn: (
    sectionId: string,
    columnId: string,
    updates: Partial<PageColumn>,
    rowId?: string,
  ) => void;

  // Block actions
  handleAddBlock: (sectionId: string, blockType: PageBlock["type"], columnId?: string) => void;
  handleRemoveBlock: (sectionId: string, blockId: string, columnId?: string) => void;
  handleUpdateBlock: (sectionId: string, blockId: string, updates: Partial<PageBlock>, columnId?: string) => void;
  handleReorderBlocks: (sectionId: string, oldIndex: number, newIndex: number, columnId?: string) => void;
  handleMoveBlock: (
    fromSectionId: string,
    toSectionId: string,
    blockId: string,
    fromColumnId?: string,
    toColumnId?: string,
    targetIndex?: number,
  ) => void;
  handleAddNestedColumn: (sectionId: string, rowBlockId: string) => void;
  handleRemoveNestedColumn: (sectionId: string, rowBlockId: string, columnId: string) => void;
  handleUpdateNestedColumn: (
    sectionId: string,
    rowBlockId: string,
    columnId: string,
    updates: Partial<RowBlockColumn>,
  ) => void;

  handleInsertTemplate: (template: PatternTemplate) => void;
  canModifyLayout: boolean;
}

export const PageBuilderContext = React.createContext<PageBuilderContextType | null>(null);

export function usePageBuilder() {
  const context = React.useContext(PageBuilderContext);
  if (!context) {
    throw new Error("usePageBuilder must be used within a PageBuilderProvider");
  }
  return context;
}

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Migrate every section in a document to the rows shape (idempotent). */
function migrateDocument(doc: PageBuilderDocument | undefined, legacyContent?: string): PageBuilderDocument {
  const base = doc ?? { version: "1.0" as const, sections: [] };
  if ((!base.sections || base.sections.length === 0) && legacyContent && legacyContent.trim()) {
    return {
      version: "1.0",
      sections: [
        {
          id: genId("sec"),
          type: "section",
          style: { padding: "py-12", backgroundColor: "#ffffff" },
          rows: [
            {
              id: genId("row"),
              layout: "1-col",
              columns: [
                {
                  id: genId("col"),
                  blocks: [
                    {
                      id: genId("blk"),
                      type: "html",
                      content: { html: legacyContent },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
  }
  return { ...base, sections: base.sections.map(ensureSectionUsesRows) };
}

/** Apply a transform to one section by id and return the new formData. */
function withSection(
  prev: Partial<PageContent>,
  sectionId: string,
  transform: (section: PageBuilderSection) => PageBuilderSection,
): Partial<PageContent> {
  const current = prev.builderData ?? { version: "1.0" as const, sections: [] };
  return {
    ...prev,
    builderData: {
      ...current,
      sections: current.sections.map((s) => (s.id === sectionId ? transform(s) : s)),
    },
  };
}

/** Apply a transform to a section's rows after normalizing it to the rows shape. */
function withRows(
  prev: Partial<PageContent>,
  sectionId: string,
  transform: (rows: PageBuilderRow[]) => PageBuilderRow[],
): Partial<PageContent> {
  return withSection(prev, sectionId, (s) => {
    const normalized = ensureSectionUsesRows(s);
    return { ...normalized, rows: transform(normalized.rows ?? []) };
  });
}

/**
 * Update the blocks list inside a specific column, supporting both the new
 * rows shape and the legacy section.columns / section.blocks shapes so this
 * helper works regardless of when migration has happened.
 */
function transformBlocksRecursively(
  blocks: PageBlock[],
  targetColumnId: string | undefined,
  targetBlockId: string | undefined,
  transform: (blocks: PageBlock[]) => PageBlock[],
  transformBlockSingle?: (block: PageBlock) => PageBlock,
): PageBlock[] {
  if (targetColumnId) {
    return blocks.map((b) => {
      if (b.type === "row" && b.content?.columns) {
        const columns = b.content.columns.map((col: any) => {
          if (col.id === targetColumnId) {
            return { ...col, blocks: transform(col.blocks || []) };
          }
          return {
            ...col,
            blocks: transformBlocksRecursively(col.blocks || [], targetColumnId, targetBlockId, transform, transformBlockSingle),
          };
        });
        return {
          ...b,
          content: {
            ...b.content,
            columns,
          },
        };
      }
      return b;
    });
  }

  if (targetBlockId) {
    const hasBlock = blocks.some((b) => b.id === targetBlockId);
    if (hasBlock) {
      if (transformBlockSingle) {
        return blocks.map((b) => (b.id === targetBlockId ? transformBlockSingle(b) : b));
      }
      return transform(blocks);
    }
    return blocks.map((b) => {
      if (b.type === "row" && b.content?.columns) {
        return {
          ...b,
          content: {
            ...b.content,
            columns: b.content.columns.map((col: any) => ({
              ...col,
              blocks: transformBlocksRecursively(col.blocks || [], targetColumnId, targetBlockId, transform, transformBlockSingle),
            })),
          },
        };
      }
      return b;
    });
  }

  return transform(blocks);
}

function findColumnBlocks(blocks: PageBlock[], columnId: string): PageBlock[] | null {
  for (const b of blocks) {
    if (b.type === "row" && b.content?.columns) {
      const col = b.content.columns.find((c: any) => c.id === columnId);
      if (col) return col.blocks || [];
      for (const c of b.content.columns) {
        const found = findColumnBlocks(c.blocks || [], columnId);
        if (found) return found;
      }
    }
  }
  return null;
}

export function getColumnBlocks(section: PageBuilderSection, columnId: string | undefined): PageBlock[] {
  if (!columnId) {
    if (section.rows && section.rows.length === 1 && section.rows[0].columns.length === 1) {
      return section.rows[0].columns[0].blocks || [];
    }
    return section.blocks || [];
  }
  
  if (section.rows) {
    for (const row of section.rows) {
      const topCol = row.columns.find((c) => c.id === columnId);
      if (topCol) return topCol.blocks || [];
      
      for (const col of row.columns) {
        const found = findColumnBlocks(col.blocks || [], columnId);
        if (found) return found;
      }
    }
  }
  
  if (section.columns) {
    const col = section.columns.find((c) => c.id === columnId);
    if (col) return col.blocks || [];
  }
  
  return [];
}

function updateColumnBlocks(
  section: PageBuilderSection,
  columnId: string | undefined,
  transform: (blocks: PageBlock[]) => PageBlock[],
  blockId?: string,
  transformBlockSingle?: (block: PageBlock) => PageBlock,
): PageBuilderSection {
  if (section.rows) {
    return {
      ...section,
      rows: section.rows.map((row) => {
        if (columnId && row.columns.some((c) => c.id === columnId)) {
          return {
            ...row,
            columns: row.columns.map((col) =>
              col.id === columnId ? { ...col, blocks: transform(col.blocks ?? []) } : col,
            ),
          };
        }
        return {
          ...row,
          columns: row.columns.map((col) => ({
            ...col,
            blocks: transformBlocksRecursively(
              col.blocks ?? [],
              columnId,
              blockId,
              transform,
              transformBlockSingle
            ),
          })),
        };
      }),
    };
  }
  if (columnId && section.columns) {
    return {
      ...section,
      columns: section.columns.map((col) =>
        col.id === columnId ? { ...col, blocks: transform(col.blocks ?? []) } : col,
      ),
    };
  }
  return { ...section, blocks: transform(section.blocks ?? []) };
}

function regenerateRowIds(row: PageBuilderRow): PageBuilderRow {
  return {
    ...row,
    id: genId("row"),
    columns: row.columns.map((col) => ({
      ...col,
      id: genId("col"),
      blocks: (col.blocks ?? []).map((b) => ({ ...b, id: genId("blk") })),
    })),
  };
}

export function PageBuilderProvider({
  children,
  initialData,
  spacingTokens,
  canModifyLayout = true,
}: {
  children: React.ReactNode;
  initialData: Partial<PageContent & Ministry>;
  spacingTokens?: SpacingTokens;
  canModifyLayout?: boolean;
}) {
  const resolvedSpacingTokens = spacingTokens ?? DEFAULT_SPACING_TOKENS;
  const [formData, setFormData] = React.useState<Partial<PageContent & Ministry>>(() => {
    const legacyContent = initialData?.content || (initialData as any)?.longDescription;
    return {
      ...initialData,
      builderData: migrateDocument(initialData?.builderData, legacyContent),
    };
  });
  const [selectedElementId, setSelectedElementId] = React.useState<string | null>(null);
  const [devicePreview, setDevicePreview] = React.useState<DevicePreview>("desktop");

  // Section actions ─────────────────────────────────────────────────────────
  const handleAddSection = () => {
    if (!canModifyLayout) return;
    const newSection: PageBuilderSection = {
      id: genId("sec"),
      type: "section",
      style: { padding: "py-12", backgroundColor: "#ffffff" },
      rows: [makeEmptyRow("1-col")],
    };
    setFormData((prev) => {
      const current = prev.builderData ?? { version: "1.0" as const, sections: [] };
      return {
        ...prev,
        builderData: { ...current, sections: [...current.sections, newSection] },
      };
    });
    setSelectedElementId(newSection.id);
  };

  const handleRemoveSection = (id: string) => {
    if (!canModifyLayout) return;
    setFormData((prev) => {
      const current = prev.builderData ?? { version: "1.0" as const, sections: [] };
      return {
        ...prev,
        builderData: { ...current, sections: current.sections.filter((s) => s.id !== id) },
      };
    });
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleReorderSections = (oldIndex: number, newIndex: number) => {
    if (!canModifyLayout) return;
    setFormData((prev) => {
      const current = prev.builderData ?? { version: "1.0" as const, sections: [] };
      const sections = [...current.sections];
      const [moved] = sections.splice(oldIndex, 1);
      sections.splice(newIndex, 0, moved);
      return { ...prev, builderData: { ...current, sections } };
    });
  };

  const handleDuplicateSection = (id: string) => {
    if (!canModifyLayout) return;
    setFormData((prev) => {
      const current = prev.builderData ?? { version: "1.0" as const, sections: [] };
      const sections = [...current.sections];
      const index = sections.findIndex((s) => s.id === id);
      if (index === -1) return prev;
      const normalized = ensureSectionUsesRows(sections[index]);
      const dup: PageBuilderSection = {
        ...JSON.parse(JSON.stringify(normalized)),
        id: genId("sec"),
        rows: (normalized.rows ?? []).map(regenerateRowIds),
      };
      sections.splice(index + 1, 0, dup);
      return { ...prev, builderData: { ...current, sections } };
    });
  };

  const handleUpdateSection = (id: string, updates: Partial<PageBuilderSection>) => {
    setFormData((prev) => withSection(prev, id, (s) => ({ ...s, ...updates })));
  };

  // Backwards-compatible shim: maps the old "section layout" control onto the
  // section's first row. The inspector hides this control when a section has
  // rows, but the handler stays for any legacy callers.
  const handleChangeSectionLayout = (id: string, newLayout: RowLayout) => {
    if (!canModifyLayout) return;
    setFormData((prev) =>
      withRows(prev, id, (rows) =>
        rows.length > 0
          ? [convertRowLayout(rows[0], newLayout), ...rows.slice(1)]
          : [makeEmptyRow(newLayout)],
      ),
    );
  };

  // Row actions ─────────────────────────────────────────────────────────────
  const handleAddRow = (sectionId: string) => {
    if (!canModifyLayout) return;
    const newRow = makeEmptyRow("1-col");
    setFormData((prev) => withRows(prev, sectionId, (rows) => [...rows, newRow]));
    setSelectedElementId(newRow.id);
  };

  const handleRemoveRow = (sectionId: string, rowId: string) => {
    if (!canModifyLayout) return;
    setFormData((prev) =>
      withRows(prev, sectionId, (rows) => {
        const filtered = rows.filter((r) => r.id !== rowId);
        // Never leave a section without at least one row.
        return filtered.length > 0 ? filtered : rows;
      }),
    );
    if (selectedElementId === rowId) setSelectedElementId(sectionId);
  };

  const handleDuplicateRow = (sectionId: string, rowId: string) => {
    if (!canModifyLayout) return;
    setFormData((prev) =>
      withRows(prev, sectionId, (rows) => {
        const index = rows.findIndex((r) => r.id === rowId);
        if (index === -1) return rows;
        const dup = regenerateRowIds(JSON.parse(JSON.stringify(rows[index])));
        const next = [...rows];
        next.splice(index + 1, 0, dup);
        return next;
      }),
    );
  };

  const handleReorderRows = (sectionId: string, oldIndex: number, newIndex: number) => {
    if (!canModifyLayout) return;
    setFormData((prev) =>
      withRows(prev, sectionId, (rows) => {
        if (
          oldIndex < 0 ||
          newIndex < 0 ||
          oldIndex >= rows.length ||
          newIndex >= rows.length ||
          oldIndex === newIndex
        ) {
          return rows;
        }
        const next = [...rows];
        const [moved] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, moved);
        return next;
      }),
    );
  };

  const handleUpdateRow = (sectionId: string, rowId: string, updates: Partial<PageBuilderRow>) => {
    setFormData((prev) =>
      withRows(prev, sectionId, (rows) => rows.map((r) => (r.id === rowId ? { ...r, ...updates } : r))),
    );
  };

  const handleChangeRowLayout = (sectionId: string, rowId: string, newLayout: RowLayout) => {
    if (!canModifyLayout) return;
    setFormData((prev) =>
      withRows(prev, sectionId, (rows) =>
        rows.map((r) => (r.id === rowId ? convertRowLayout(r, newLayout) : r)),
      ),
    );
  };

  // Column actions ──────────────────────────────────────────────────────────
  // Mutates the matching column wherever it lives — inside section.rows[]
  // (modern shape) or section.columns (legacy). `rowId` is only used as a
  // hint to disambiguate when a section uses rows; the lookup tolerates a
  // missing rowId and finds the column anywhere it appears under the section.
  const handleUpdateColumn = (
    sectionId: string,
    columnId: string,
    updates: Partial<PageColumn>,
    _rowId?: string,
  ) => {
    if (!canModifyLayout) return;
    void _rowId; // accepted for callsite clarity; lookup walks both shapes
    setFormData((prev) =>
      withSection(prev, sectionId, (s) => {
        const mapCol = (c: PageColumn): PageColumn =>
          c.id === columnId ? { ...c, ...updates } : c;
        if (s.rows && s.rows.length > 0) {
          return {
            ...s,
            rows: s.rows.map((r) => ({ ...r, columns: r.columns.map(mapCol) })),
          };
        }
        if (s.columns) {
          return { ...s, columns: s.columns.map(mapCol) };
        }
        return s;
      }),
    );
  };

  // Block actions ───────────────────────────────────────────────────────────
  const handleAddBlock = (sectionId: string, blockType: PageBlock["type"], columnId?: string) => {
    if (!canModifyLayout) return;
    const newBlock: PageBlock = {
      id: genId("blk"),
      type: blockType,
      content: getInitialBlockContent(blockType),
    };
    setFormData((prev) =>
      withSection(prev, sectionId, (s) => updateColumnBlocks(s, columnId, (blocks) => [...blocks, newBlock])),
    );
    setSelectedElementId(newBlock.id);
  };

  const handleRemoveBlock = (sectionId: string, blockId: string, columnId?: string) => {
    if (!canModifyLayout) return;
    setFormData((prev) =>
      withSection(prev, sectionId, (s) =>
        updateColumnBlocks(s, columnId, (blocks) => blocks.filter((b) => b.id !== blockId), blockId),
      ),
    );
    if (selectedElementId === blockId) setSelectedElementId(sectionId);
  };

  const handleUpdateBlock = (
    sectionId: string,
    blockId: string,
    updates: Partial<PageBlock>,
    columnId?: string,
  ) => {
    setFormData((prev) =>
      withSection(prev, sectionId, (s) =>
        updateColumnBlocks(
          s,
          columnId,
          (blocks) => blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
          blockId,
          (b) => ({ ...b, ...updates })
        ),
      ),
    );
  };

  const handleReorderBlocks = (
    sectionId: string,
    oldIndex: number,
    newIndex: number,
    columnId?: string,
  ) => {
    if (!canModifyLayout) return;
    setFormData((prev) =>
      withSection(prev, sectionId, (s) =>
        updateColumnBlocks(s, columnId, (blocks) => {
          if (
            oldIndex < 0 ||
            newIndex < 0 ||
            oldIndex >= blocks.length ||
            newIndex >= blocks.length ||
            oldIndex === newIndex
          ) {
            return blocks;
          }
          const next = [...blocks];
          const [moved] = next.splice(oldIndex, 1);
          next.splice(newIndex, 0, moved);
          return next;
        }, undefined),
      ),
    );
  };

  const handleMoveBlock = (
    fromSectionId: string,
    toSectionId: string,
    blockId: string,
    fromColumnId?: string,
    toColumnId?: string,
    targetIndex?: number,
  ) => {
    if (!canModifyLayout) return;
    setFormData((prev) => {
      let movedBlock: PageBlock | null = null;
      const nextSourceSection = withSection(prev, fromSectionId, (s) =>
        updateColumnBlocks(s, fromColumnId, (blocks) => {
          const found = blocks.find((b) => b.id === blockId);
          if (found) movedBlock = found;
          return blocks.filter((b) => b.id !== blockId);
        }, blockId)
      );

      if (!movedBlock) return prev;

      let updatedData = nextSourceSection.builderData;
      if (!updatedData) return prev;

      const targetSectionIndex = updatedData.sections.findIndex((s) => s.id === toSectionId);
      if (targetSectionIndex === -1) return prev;

      const targetSection = updatedData.sections[targetSectionIndex];
      const updatedTargetSection = updateColumnBlocks(targetSection, toColumnId, (blocks) => {
        const next = [...blocks];
        const insertIndex = typeof targetIndex === "number" && targetIndex >= 0 ? targetIndex : next.length;
        next.splice(insertIndex, 0, movedBlock!);
        return next;
      });

      return {
        ...prev,
        builderData: {
          ...updatedData,
          sections: updatedData.sections.map((s) => (s.id === toSectionId ? updatedTargetSection : s)),
        },
      };
    });
  };

  const handleAddNestedColumn = (sectionId: string, rowBlockId: string) => {
    if (!canModifyLayout) return;
    setFormData((prev) =>
      withSection(prev, sectionId, (s) =>
        updateColumnBlocks(
          s,
          undefined,
          (blocks) => blocks,
          rowBlockId,
          (b) => {
            if (b.type === "row" && b.content?.columns) {
              const currentCols = b.content.columns;
              if (currentCols.length >= 4) return b;
              const newCol = { id: genId("col"), width: "50%", blocks: [] };
              const updatedCols = [...currentCols, newCol];
              const equalWidth = `${100 / updatedCols.length}%`;
              updatedCols.forEach((c: any) => {
                c.width = equalWidth;
              });
              return {
                ...b,
                content: {
                  ...b.content,
                  columns: updatedCols,
                },
              };
            }
            return b;
          }
        )
      )
    );
  };

  const handleRemoveNestedColumn = (sectionId: string, rowBlockId: string, columnId: string) => {
    if (!canModifyLayout) return;
    setFormData((prev) =>
      withSection(prev, sectionId, (s) =>
        updateColumnBlocks(
          s,
          undefined,
          (blocks) => blocks,
          rowBlockId,
          (b) => {
            if (b.type === "row" && b.content?.columns) {
              const currentCols = b.content.columns;
              if (currentCols.length <= 1) return b;
              const updatedCols = currentCols.filter((c: any) => c.id !== columnId);
              const equalWidth = `${100 / updatedCols.length}%`;
              updatedCols.forEach((c: any) => {
                c.width = equalWidth;
              });
              return {
                ...b,
                content: {
                  ...b.content,
                  columns: updatedCols,
                },
              };
            }
            return b;
          }
        )
      )
    );
  };

  const handleUpdateNestedColumn = (
    sectionId: string,
    rowBlockId: string,
    columnId: string,
    updates: Partial<RowBlockColumn>,
  ) => {
    setFormData((prev) =>
      withSection(prev, sectionId, (s) =>
        updateColumnBlocks(
          s,
          undefined,
          (blocks) => blocks,
          rowBlockId,
          (b) => {
            if (b.type === "row" && b.content?.columns) {
              return {
                ...b,
                content: {
                  ...b.content,
                  columns: b.content.columns.map((c: any) =>
                    c.id === columnId ? { ...c, ...updates } : c
                  ),
                },
              };
            }
            return b;
          }
        )
      )
    );
  };

  // Templates ───────────────────────────────────────────────────────────────
  const handleInsertTemplate = (template: PatternTemplate) => {
    setFormData((prev) => {
      const current = prev.builderData ?? { version: "1.0" as const, sections: [] };
      const newSections = template.sections.map((section) => {
        const cloned: PageBuilderSection = JSON.parse(JSON.stringify(section));
        cloned.id = genId("sec");
        // Regenerate legacy ids before migrating to rows so every nested id is fresh.
        if (cloned.columns) {
          cloned.columns = cloned.columns.map((col) => ({
            ...col,
            id: genId("col"),
            blocks: (col.blocks ?? []).map((b) => ({ ...b, id: genId("blk") })),
          }));
        }
        if (cloned.blocks) {
          cloned.blocks = cloned.blocks.map((b) => ({ ...b, id: genId("blk") }));
        }
        if (cloned.rows) {
          cloned.rows = cloned.rows.map(regenerateRowIds);
        }
        return ensureSectionUsesRows(cloned);
      });
      return {
        ...prev,
        builderData: { ...current, sections: [...current.sections, ...newSections] },
      };
    });
  };

  return (
    <PageBuilderContext.Provider
      value={{
        formData,
        setFormData,
        selectedElementId,
        setSelectedElementId,
        devicePreview,
        setDevicePreview,
        spacingTokens: resolvedSpacingTokens,
        handleAddSection,
        handleRemoveSection,
        handleReorderSections,
        handleDuplicateSection,
        handleUpdateSection,
        handleChangeSectionLayout,
        handleAddRow,
        handleRemoveRow,
        handleDuplicateRow,
        handleReorderRows,
        handleUpdateRow,
        handleChangeRowLayout,
        handleUpdateColumn,
        handleAddBlock,
        handleRemoveBlock,
        handleUpdateBlock,
        handleReorderBlocks,
        handleMoveBlock,
        handleAddNestedColumn,
        handleRemoveNestedColumn,
        handleUpdateNestedColumn,
        handleInsertTemplate,
        canModifyLayout,
      }}
    >
      {children}
    </PageBuilderContext.Provider>
  );
}

function getInitialBlockContent(type: PageBlock["type"]) {
  switch (type) {
    case "heading":
      return { text: "Heading Text", level: "h2", alignment: "left", variant: "default" };
    case "paragraph":
      return { text: "Add your text here...", alignment: "left", maxWidth: "full" };
    case "image":
      return { url: "", alt: "", caption: "", alignment: "center", widthStyle: "full" };
    case "button":
      return {
        label: "Click Here",
        url: "#",
        variant: "primary",
        alignment: "left",
        padding: { top: "8px", right: "16px", bottom: "8px", left: "16px" },
        paddingLinked: false,
      };
    case "video":
      return { url: "", title: "Video Player", thumbnailFirst: false };
    case "divider":
      return { thickness: 1, color: "slate-200", spacing: "py-4" };
    case "spacer":
      return { heightDesktop: "h-8", heightMobile: "h-4" };
    case "card":
      return {
        title: "Card Title",
        description: "Card description",
        imageUrl: "",
        buttonLabel: "",
        buttonUrl: "",
      };
    case "iconText":
      return { icon: "star", title: "Feature", description: "Details here" };
    case "iconBox":
      return {
        variant: "icon",
        icon: "star",
        iconUrl: "",
        alt: "",
        title: "Feature title",
        description: "Short supporting description.",
        level: "h3",
        url: "",
        openInNewTab: false,
        alignment: "center",
      };
    case "googleMap":
      return {
        embedUrl: "",
        height: 400,
        fullWidth: false,
      };
    case "gallery":
      return {
        images: [] as Array<{ url: string; alt?: string; caption?: string }>,
        columns: 3,
        gutter: "md",
        rounded: true,
        lightbox: true,
      };
    case "carousel":
      return {
        images: [] as Array<{ url: string; alt?: string }>,
        autoplay: true,
        autoplaySpeedMs: 5000,
        showArrows: true,
        showDots: true,
        transition: "slide" as "slide" | "fade",
        height: 480,
        rounded: true,
        shadow: false,
      };
    case "countdown":
      return {
        // Default to 7 days from now so the editor preview is meaningful.
        targetDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        label: "Event starts in",
        style: "boxed" as "boxed" | "inline",
        accentColor: "#e7ab10",
        alignment: "center" as "left" | "center" | "right",
      };
    case "cta":
      return {
        title: "Call to action",
        text: "Join us today and make a difference.",
        buttonLabel: "Action",
        buttonUrl: "#",
        backgroundStyle: "navy",
      };
    case "html":
      return {
        html: "<div><p>Enter custom HTML here...</p></div>",
      };
    case "row":
      return {
        columns: [
          { id: genId("col"), width: "50%", blocks: [] },
          { id: genId("col"), width: "50%", blocks: [] },
        ],
        responsive: {
          desktop: "horizontal",
          tablet: "auto",
          mobile: "stacked",
        },
      };
    default:
      return {};
  }
}
