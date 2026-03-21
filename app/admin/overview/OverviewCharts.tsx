"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FunnelPoint = { stage: string; count: number };
type RevenuePoint = { day: string; revenue: number };
type SourcePoint = { source: string; count: number };

type Props = Readonly<{
  funnel: FunnelPoint[];
  revenueSeries: RevenuePoint[];
  sources: SourcePoint[];
}>;

const PIE_COLORS = ["#10b981", "#06b6d4", "#3b82f6", "#a78bfa", "#f59e0b"];

const tooltipStyle = {
  fontSize: 12,
  backgroundColor: "rgba(9,9,11,0.95)",
  border: "1px solid rgba(63,63,70,1)",
  borderRadius: 8,
  color: "#f4f4f5",
};

export default function OverviewCharts({ funnel, revenueSeries, sources }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="text-sm font-semibold text-zinc-100">Lead funnel</h3>
        <p className="mt-1 text-xs text-zinc-400">Assessment → lead → deposit paid → completed</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="stage" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#a1a1aa", fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="text-sm font-semibold text-zinc-100">Lead sources</h3>
        <p className="mt-1 text-xs text-zinc-400">Top 5 attribution sources</p>
        <div className="mt-4 h-72">
          {sources.length === 0 ? (
            <p className="text-sm text-zinc-400">No source data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sources}
                  dataKey="count"
                  nameKey="source"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {sources.map((entry, idx) => (
                    <Cell key={`${entry.source}-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: "#e4e4e7", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 xl:col-span-2">
        <h3 className="text-sm font-semibold text-zinc-100">Revenue (last 30 days)</h3>
        <p className="mt-1 text-xs text-zinc-400">Daily succeeded payments (USD)</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
              <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
