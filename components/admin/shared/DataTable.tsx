import * as React from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = "No results found.",
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg", className)}>
      <table className="min-w-full divide-y divide-stonehill-line">
        <thead className="bg-stonehill-cream">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                scope="col"
                className={cn(
                  "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-stonehill-evergreen sm:pl-6",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stonehill-line bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-stonehill-ink/60">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={keyExtractor(item)} className="hover:bg-stonehill-cream/30 transition-colors">
                {columns.map((col, i) => (
                  <td
                    key={i}
                    className={cn(
                      "whitespace-nowrap py-4 pl-4 pr-3 text-sm text-stonehill-ink sm:pl-6",
                      col.className
                    )}
                  >
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                      ? (item[col.accessorKey] as React.ReactNode)
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
