"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

export type AdminDataTableColumn<T> = Readonly<{
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Clicks in this cell do not trigger row navigation */
  stopRowClick?: boolean;
}>;

type Props<T> = Readonly<{
  columns: AdminDataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  getRowHref?: (row: T) => string | null;
  getRowKey?: (row: T, index: number) => string;
}>;

export default function AdminDataTable<T>({
  columns,
  rows,
  emptyMessage,
  getRowHref,
  getRowKey,
}: Props<T>) {
  const router = useRouter();

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
    <div className="overflow-x-auto overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/40">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className={
                  column.className ??
                  "px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-zinc-400"
                }
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const href = getRowHref ? getRowHref(row) : null;
            const rowKey = getRowKey ? getRowKey(row, rowIndex) : String(rowIndex);
            return (
              <tr
                key={rowKey}
                className={
                  href
                    ? "group cursor-pointer border-b border-zinc-800 transition-colors hover:bg-zinc-800/50 hover:ring-1 hover:ring-sky-500/20"
                    : "border-b border-zinc-800"
                }
                onClick={
                  href
                    ? () => {
                        router.push(href);
                      }
                    : undefined
                }
                onKeyDown={
                  href
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(href);
                        }
                      }
                    : undefined
                }
                tabIndex={href ? 0 : undefined}
                title={href ? "View lead details" : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className="px-4 py-3 align-top"
                    onClick={column.stopRowClick ? (e) => e.stopPropagation() : undefined}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
