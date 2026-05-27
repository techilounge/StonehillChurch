"use client";

import * as React from "react";
import { PageContent } from "@/types/content";
import {
  PageBlock,
  PageBuilderDocument,
  PageBuilderRow,
  PageBuilderSection,
  PatternTemplate,
  RowLayout,
} from "@/types/pageBuilder";
import {
  convertRowLayout,
  ensureSectionUsesRows,
  makeEmptyRow,
} from "@/lib/page-builder-rows";

interface PageBuilderContextType {
  formData: Partial<PageContent>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<PageContent>>>;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;

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

  // Block actions
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

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Migrate every section in a document to the rows shape (idempotent). */
function migrateDocument(doc: PageBuilderDocument | undefined): PageBuilderDocument {
  const base = doc ?? { version: "1.0" as const, sections: [] };
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
function updateColumnBlocks(
  section: PageBuilderSection,
  columnId: string | undefined,
  transform: (blocks: PageBlock[]) => PageBlock[],
): PageBuilderSection {
  if (section.rows) {
    return {
      ...section,
      rows: section.rows.map((row) => {
        if (columnId) {
          if (!row.columns.some((c) => c.id === columnId)) return row;
          return {
            ...row,
            columns: row.columns.map((col) =>
              col.id === columnId ? { ...col, blocks: transform(col.blocks ?? []) } : col,
            ),
          };
        }
        // No columnId given (legacy single-block section): only apply when the
        // row has exactly one column, otherwise we can't know which to target.
        if (row.columns.length === 1) {
          return {
            ...row,
            columns: [{ ...row.columns[0], blocks: transform(row.columns[0].blocks ?? []) }],
          };
        }
        return row;
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
}: {
  children: React.ReactNode;
  initialData: Partial<PageContent>;
}) {
  const [formData, setFormData] = React.useState<Partial<PageContent>>(() => ({
    ...initialData,
    builderData: migrateDocument(initialData?.builderData),
  }));
  const [selectedElementId, setSelectedElementId] = React.useState<string | null>(null);

  // Section actions ─────────────────────────────────────────────────────────
  const handleAddSection = () => {
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
    setFormData((prev) => {
      const current = prev.builderData ?? { version: "1.0" as const, sections: [] };
      const sections = [...current.sections];
      const [moved] = sections.splice(oldIndex, 1);
      sections.splice(newIndex, 0, moved);
      return { ...prev, builderData: { ...current, sections } };
    });
  };

  const handleDuplicateSection = (id: string) => {
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
    const newRow = makeEmptyRow("1-col");
    setFormData((prev) => withRows(prev, sectionId, (rows) => [...rows, newRow]));
    setSelectedElementId(newRow.id);
  };

  const handleRemoveRow = (sectionId: string, rowId: string) => {
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
    setFormData((prev) =>
      withRows(prev, sectionId, (rows) =>
        rows.map((r) => (r.id === rowId ? convertRowLayout(r, newLayout) : r)),
      ),
    );
  };

  // Block actions ───────────────────────────────────────────────────────────
  const handleAddBlock = (sectionId: string, blockType: PageBlock["type"], columnId?: string) => {
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
    setFormData((prev) =>
      withSection(prev, sectionId, (s) =>
        updateColumnBlocks(s, columnId, (blocks) => blocks.filter((b) => b.id !== blockId)),
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
        updateColumnBlocks(s, columnId, (blocks) =>
          blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)),
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
        }),
      ),
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
        handleAddBlock,
        handleRemoveBlock,
        handleUpdateBlock,
        handleReorderBlocks,
        handleInsertTemplate,
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
    default:
      return {};
  }
}
