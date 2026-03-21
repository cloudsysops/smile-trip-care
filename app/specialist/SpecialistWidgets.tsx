"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

type SparkData = { day: string; value: number };

type StatCard = {
  label: string;
  value: number;
  trend: number;
  spark: SparkData[];
  accent: string;
};

type CaseRow = {
  id: string;
  patient_name: string;
  treatment: string;
  status: string;
  last_update: string | null;
};

/** SVG sparkline — avoids Recharts ResponsiveContainer width=0 on mobile / hydration quirks. */
function SparklineSvg({ data, accent }: { data: SparkData[]; accent: string }) {
  const w = 240;
  const h = 48;
  const pad = 2;
  if (data.length === 0) {
    return (
      <div className="flex h-12 items-center text-[11px] text-zinc-500" role="status">
        No activity yet
      </div>
    );
  }
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const innerW = w - pad * 2;
  const n = data.length;
  const step = n > 1 ? innerW / (n - 1) : 0;

  if (n === 1) {
    const y = pad + (h - pad * 2) * (1 - (data[0].value - min) / range);
    const cx = w / 2;
    return (
      <svg
        width="100%"
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        className="min-h-[48px] min-w-0"
        aria-hidden
      >
        <circle cx={cx} cy={y} r={3} fill={accent} />
      </svg>
    );
  }

  const pts = data.map((d, i) => {
    const x = pad + i * step;
    const y = pad + (h - pad * 2) * (1 - (d.value - min) / range);
    return `${x},${y}`;
  });
  return (
    <svg
      width="100%"
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="min-h-[48px] min-w-0 text-zinc-500"
      aria-hidden
    >
      <polyline fill="none" stroke={accent} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={pts.join(" ")} />
    </svg>
  );
}

export function SpecialistStatsRow({ cards }: { cards: StatCard[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-wide text-zinc-400 sm:text-xs">{card.label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-100 sm:mt-2 sm:text-3xl">{card.value}</p>
          <p className={`mt-0.5 text-[11px] sm:mt-1 sm:text-xs ${card.trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {card.trend >= 0 ? "↑" : "↓"} {Math.abs(card.trend).toFixed(1)}%
          </p>
          <div className="relative mt-2 hidden min-h-[48px] w-full min-w-0 sm:mt-3 sm:block">
            <SparklineSvg data={card.spark} accent={card.accent} />
          </div>
        </article>
      ))}
    </section>
  );
}

type StatusDonutPoint = { name: string; value: number };

const DONUT_COLORS = ["#10b981", "#0ea5e9", "#a3a3a3"];

export function SpecialistStatusDonut({ data }: { data: StatusDonutPoint[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">Cases by status</h3>
        <div className="mt-3 flex min-h-[192px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-8 text-center text-sm text-zinc-400">
          No cases yet — status breakdown will appear when you have active consultations.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
      <h3 className="text-sm font-semibold text-zinc-100">Cases by status</h3>
      <div className="mt-3 flex min-h-[192px] w-full min-w-0 justify-center overflow-x-auto">
        <PieChart width={220} height={192} className="max-w-full shrink-0">
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={78}>
            {data.map((entry, i) => (
              <Cell key={`${entry.name}-${i}`} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontSize: 12,
              backgroundColor: "rgba(9,9,11,0.95)",
              border: "1px solid rgba(63,63,70,1)",
              borderRadius: 8,
              color: "#f4f4f5",
            }}
          />
        </PieChart>
      </div>
    </section>
  );
}

export function SpecialistPatientTable({ rows }: { rows: CaseRow[] }) {
  const [sortBy, setSortBy] = useState<"name" | "status" | "updated">("updated");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      if (sortBy === "name") return a.patient_name.localeCompare(b.patient_name);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      const da = a.last_update ? new Date(a.last_update).getTime() : 0;
      const db = b.last_update ? new Date(b.last_update).getTime() : 0;
      return da - db;
    });
    return asc ? out : out.reverse();
  }, [rows, sortBy, asc]);

  function setSort(col: "name" | "status" | "updated") {
    if (sortBy === col) setAsc((v) => !v);
    else {
      setSortBy(col);
      setAsc(false);
    }
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">Patient list</h3>
        <p className="mt-4 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 px-3 py-6 text-center text-sm text-zinc-400">
          No patients assigned yet. Cases will show here when consultations are created for you.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 sm:p-4">
      <h3 className="text-sm font-semibold text-zinc-100">Patient list</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-xs sm:text-sm">
          <thead className="border-b border-zinc-800 text-zinc-400">
            <tr>
              <th className="px-2 py-2">
                <button type="button" onClick={() => setSort("name")}>
                  Name
                </button>
              </th>
              <th className="px-2 py-2">Treatment</th>
              <th className="px-2 py-2">
                <button type="button" onClick={() => setSort("status")}>
                  Status
                </button>
              </th>
              <th className="px-2 py-2">
                <button type="button" onClick={() => setSort("updated")}>
                  Last update
                </button>
              </th>
              <th className="px-2 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className="border-b border-zinc-800/80 hover:bg-zinc-800/40">
                <td className="px-2 py-2 text-zinc-200">{r.patient_name}</td>
                <td className="px-2 py-2 text-zinc-300">{r.treatment}</td>
                <td className="px-2 py-2 capitalize text-zinc-300">{r.status}</td>
                <td className="px-2 py-2 text-zinc-400">{r.last_update ? new Date(r.last_update).toLocaleDateString() : "—"}</td>
                <td className="px-2 py-2">
                  <a href={`/specialist/cases/${r.id}`} className="text-emerald-400 hover:underline">
                    View case →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
