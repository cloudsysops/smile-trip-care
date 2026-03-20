import type { ReactNode } from "react";

export type DataTableColumn<T> = Readonly<{
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}>;

type Props<T> = Readonly<{
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  getRowHref?: (row: T) => string | null;
}>;

export default function DataTable<T>({ columns, rows, emptyMessage, getRowHref }: Props<T>) {
  if (rows.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <p className="p-8 text-center text-sm text-zinc-500">
          {emptyMessage ?? "No data yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className={column.className ?? "px-4 py-3.5 text-sm font-semibold uppercase tracking-wide text-zinc-500"}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = getRowHref ? getRowHref(row) : null;
            const cells = columns.map((column) => (
              <td key={column.header} className="px-4 py-3 align-top">
                {column.cell(row)}
              </td>
            ));
            return (
              <tr
                key={href ?? JSON.stringify(row)}
                className="border-b border-zinc-100"
              >
                {href ? (
                  columns.map((column) => (
                    <td
                      key={column.header}
                      className="px-4 py-3 align-top"
                    >
                      <a href={href} className="block hover:bg-zinc-50">
                        {column.cell(row)}
                      </a>
                    </td>
                  ))
                ) : (
                  cells
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

