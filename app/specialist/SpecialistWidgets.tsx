"use client";

import { useMemo, useState } from "react";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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

export function SpecialistStatsRow({ cards }: { cards: StatCard[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">{card.label}</p>
          <p className="mt-2 text-3xl font-bold text-zinc-100">{card.value}</p>
          <p className={`mt-1 text-xs ${card.trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {card.trend >= 0 ? "↑" : "↓"} {Math.abs(card.trend).toFixed(1)}%
          </p>
          <div className="mt-3 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={card.spark}>
                <Line type="monotone" dataKey="value" stroke={card.accent} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      ))}
    </section>
  );
}

type StatusDonutPoint = { name: string; value: number };

const DONUT_COLORS = ["#10b981", "#0ea5e9", "#a3a3a3"];

export function SpecialistStatusDonut({ data }: { data: StatusDonutPoint[] }) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
      <h3 className="text-sm font-semibold text-zinc-100">Cases by status</h3>
      <div className="mt-3 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
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
        </ResponsiveContainer>
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

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
      <h3 className="text-sm font-semibold text-zinc-100">Patient list</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-800 text-zinc-400">
            <tr>
              <th className="px-2 py-2"><button type="button" onClick={() => setSort("name")}>Name</button></th>
              <th className="px-2 py-2">Treatment</th>
              <th className="px-2 py-2"><button type="button" onClick={() => setSort("status")}>Status</button></th>
              <th className="px-2 py-2"><button type="button" onClick={() => setSort("updated")}>Last update</button></th>
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
