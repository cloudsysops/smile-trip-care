import type { ReactNode } from "react";

export type AdminDataTableColumn<T> = Readonly<{
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}>;

type Props<T> = Readonly<{
  columns: AdminDataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  getRowHref?: (row: T) => string | null;
}>;

export default function AdminDataTable<T>({
  columns,
  rows,
  emptyMessage,
  getRowHref,
}: Props<T>) {
  if (rows.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
        <p className="p-8 text-center text-sm text-zinc-400">
          {emptyMessage ?? "No data yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/40">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className={column.className ?? "px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-zinc-400"}
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
                className="border-b border-zinc-800"
              >
                {href ? (
                  columns.map((column) => (
                    <td
                      key={column.header}
                      className="px-4 py-3 align-top"
                    >
                      <a
                        href={href}
                        className="block rounded-md hover:bg-zinc-800/40"
                      >
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

