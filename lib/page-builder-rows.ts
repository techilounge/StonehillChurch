import {
  PageBlock,
  PageBuilderRow,
  PageBuilderSection,
  PageColumn,
  RowLayout,
} from "@/types/pageBuilder";

/** Per-column width presets for each row layout option, in % strings. */
export const ROW_LAYOUT_COLUMN_WIDTHS: Record<RowLayout, string[]> = {
  "1-col": ["100%"],
  "2-col": ["50%", "50%"],
  "3-col": ["33.33%", "33.33%", "33.34%"],
  "4-col": ["25%", "25%", "25%", "25%"],
  "left-sidebar": ["25%", "75%"],
  "right-sidebar": ["75%", "25%"],
};

function genId(prefix: string, seed?: string) {
  const suffix = seed ?? `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}_${suffix}`;
}

/**
 * Returns the row array for a section, migrating legacy `columns`/`blocks`
 * fields into a single equivalent row when necessary. Always returns at least
 * one row so editors never see a section with no rows. Does not mutate input.
 */
export function normalizeSectionToRows(section: PageBuilderSection): PageBuilderRow[] {
  if (section.rows && section.rows.length > 0) {
    return section.rows;
  }

  if (section.columns && section.columns.length > 0) {
    return [
      {
        id: genId("row", `${section.id}_0`),
        layout: section.layout,
        columns: section.columns,
      },
    ];
  }

  if (section.blocks && section.blocks.length > 0) {
    return [
      {
        id: genId("row", `${section.id}_0`),
        layout: "1-col",
        columns: [
          { id: genId("col", `${section.id}_0`), blocks: section.blocks },
        ],
      },
    ];
  }

  // Empty section — give it a single empty 1-col row so the editor has
  // somewhere to drop blocks.
  return [
    {
      id: genId("row", `${section.id}_0`),
      layout: "1-col",
      columns: [{ id: genId("col", `${section.id}_0`), blocks: [] }],
    },
  ];
}

/**
 * Returns a copy of the section with `rows` populated (from migration if
 * needed) and the legacy `columns`/`blocks` fields cleared. Used on admin
 * load and before save so editor + Firestore state both use the new shape.
 */
export function ensureSectionUsesRows(section: PageBuilderSection): PageBuilderSection {
  const rows = normalizeSectionToRows(section);
  if (section.rows && section.rows.length > 0 && !section.columns && !section.blocks) {
    return section;
  }
  const next: PageBuilderSection = { ...section, rows };
  delete next.columns;
  delete next.blocks;
  // The section-level `layout` becomes meaningless once rows are present
  // (layout is per-row). Keep it in the type but drop the value to avoid
  // implying it still controls anything.
  delete next.layout;
  return next;
}

/**
 * Builds a row with empty columns sized per the given layout. Used when
 * adding a new row or changing a row's column count.
 */
export function makeEmptyRow(layout: RowLayout, seed?: string): PageBuilderRow {
  const widths = ROW_LAYOUT_COLUMN_WIDTHS[layout];
  const rowSeed = seed ?? `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return {
    id: genId("row", rowSeed),
    layout,
    columns: widths.map((width, i) => ({
      id: genId("col", `${rowSeed}_${i}`),
      blocks: [] as PageBlock[],
      width,
    })),
  };
}

/**
 * Converts an existing row to a new column-count layout, preserving block
 * content. When increasing column count, new empty columns are appended.
 * When decreasing, orphaned columns' blocks are merged into the last kept
 * column so no content is lost. Mirrors the behaviour of the section-level
 * conversion used before rows existed.
 */
export function convertRowLayout(row: PageBuilderRow, newLayout: RowLayout): PageBuilderRow {
  const widths = ROW_LAYOUT_COLUMN_WIDTHS[newLayout];
  const columnCount = widths.length;
  const sourceColumns = row.columns.length > 0
    ? row.columns
    : [{ id: genId("col"), blocks: [] as PageBlock[] }];

  const nextColumns: PageColumn[] = [];
  for (let i = 0; i < columnCount; i++) {
    const source = sourceColumns[i];
    nextColumns.push({
      id: source?.id || genId("col", `${row.id}_${i}`),
      style: source?.style,
      blocks: source?.blocks || [],
      width: widths[i],
    });
  }

  if (sourceColumns.length > columnCount) {
    const orphaned = sourceColumns.slice(columnCount).flatMap((c) => c.blocks || []);
    const last = nextColumns[columnCount - 1];
    nextColumns[columnCount - 1] = { ...last, blocks: [...last.blocks, ...orphaned] };
  }

  return { ...row, layout: newLayout, columns: nextColumns };
}
