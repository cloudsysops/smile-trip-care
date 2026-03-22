"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FunnelPoint = { stage: string; count: number };
type RevenuePoint = { day: string; revenue: number };

type Props = Readonly<{
  funnel: FunnelPoint[];
  revenueSeries: RevenuePoint[];
}>;

const tooltipStyle = {
  fontSize: 12,
  backgroundColor: "rgba(9,9,11,0.95)",
  border: "1px solid rgba(63,63,70,1)",
  borderRadius: 8,
  color: "#f4f4f5",
};

const CARD =
  "rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 transition-colors hover:bg-zinc-800/60";
const TITLE = "text-xs font-semibold uppercase tracking-wider text-zinc-400";

export default function OverviewCharts({ funnel, revenueSeries }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className={CARD}>
        <h3 className={TITLE}>Revenue (30 days)</h3>
        <p className="mt-1 text-xs text-zinc-400">Succeeded payments by day</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.25} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className={CARD}>
        <h3 className={TITLE}>Lead funnel</h3>
        <p className="mt-1 text-xs text-zinc-400">Assessment → lead → deposit → complete</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="stage" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#34d399" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
