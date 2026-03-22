"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

type StatusDonutPoint = { name: string; value: number };

const DONUT_COLORS = ["#10b981", "#0ea5e9", "#a3a3a3"];

const CARD_SECTION = "rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 transition-colors hover:bg-zinc-800/60";
const SECTION_TITLE = "text-xs font-semibold uppercase tracking-wider text-zinc-400";

export function SpecialistStatusDonut({ data }: { data: StatusDonutPoint[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <section className={CARD_SECTION}>
        <h3 className={SECTION_TITLE}>Cases by status</h3>
        <div className="mt-3 flex min-h-[192px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-8 text-center text-sm text-zinc-400">
          No cases yet — status breakdown will appear when you have active consultations.
        </div>
      </section>
    );
  }

  return (
    <section className={CARD_SECTION}>
      <h3 className={SECTION_TITLE}>Cases by status</h3>
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

type CaseRow = {
  id: string;
  patient_name: string;
  treatment: string;
  status: string;
  last_update: string | null;
};

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
      <section className={CARD_SECTION}>
        <h3 className={SECTION_TITLE}>Patient list</h3>
        <p className="mt-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 px-3 py-6 text-center text-sm text-zinc-400">
          No patients assigned yet. Cases will show here when consultations are created for you.
        </p>
      </section>
    );
  }

  return (
    <section className={CARD_SECTION}>
      <h3 className={SECTION_TITLE}>Patient list</h3>
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
              <tr key={r.id} className="border-b border-zinc-800/80 transition-colors hover:bg-zinc-800/60">
                <td className="px-2 py-2 text-zinc-100">{r.patient_name}</td>
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
