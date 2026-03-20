"use client";

import TreatmentStageBadge from "./TreatmentStageBadge";

export type ProgressItem = Readonly<{
  id: string;
  stage_key: string;
  stage_label: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at?: string | null;
}>;

type Props = Readonly<{
  items: readonly ProgressItem[];
  emptyMessage?: string;
}>;

export default function TreatmentProgressTimeline({ items, emptyMessage = "No progress updates yet." }: Props) {
  const sorted = [...items].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (sorted.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Treatment progress
        </h3>
        <p className="mt-4 text-sm text-zinc-400">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Treatment progress
      </h3>
      <p className="mt-1 text-sm text-zinc-400">Updates from your care team</p>
      <ol className="mt-6 space-y-0" role="list">
        {sorted.map((item, index) => {
          const isLast = index === sorted.length - 1;
          return (
            <li key={item.id} className="relative flex gap-4 pb-8 last:pb-0">
              {!isLast && (
                <span
                  className="absolute left-[11px] top-6 -bottom-2 w-0.5 bg-zinc-800"
                  aria-hidden
                />
              )}
              <span
                className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500 text-xs font-semibold text-white"
                aria-hidden
              >
                ✓
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <TreatmentStageBadge
                    stageLabel={item.stage_label}
                    status={item.status as "active" | "completed" | "cancelled"}
                  />
                  <span className="text-xs text-zinc-500">
                    {new Date(item.created_at).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </span>
                </div>
                {item.notes?.trim() ? (
                  <p className="mt-2 text-sm text-zinc-300">{item.notes}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
