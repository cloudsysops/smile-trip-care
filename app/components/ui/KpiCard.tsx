import type { ReactNode } from "react";
import TrendBadge from "./TrendBadge";

type Props = Readonly<{
  label: string;
  value: string;
  trend?: number;
  icon?: ReactNode;
  helper?: string;
}>;

export default function KpiCard({ label, value, trend, icon, helper }: Props) {
  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-sm transition hover:border-zinc-700 hover:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-zinc-100">{value}</p>
        </div>
        {icon ? <span className="text-zinc-500">{icon}</span> : null}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {typeof trend === "number" ? <TrendBadge value={trend} /> : null}
        {helper ? <p className="text-xs text-zinc-500">{helper}</p> : null}
      </div>
    </article>
  );
}
