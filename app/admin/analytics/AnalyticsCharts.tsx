"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Props = Readonly<{
  leadsByCountry: Array<{ country: string; count: number }>;
}>;

export default function AnalyticsCharts({ leadsByCountry }: Props) {
  if (leadsByCountry.length === 0) {
    return (
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="text-sm font-semibold text-zinc-100">Leads by country</h2>
        <p className="mt-2 text-sm text-zinc-400">No country data yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="text-sm font-semibold text-zinc-100">Leads by country</h2>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={leadsByCountry} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis dataKey="country" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                backgroundColor: "rgba(9,9,11,0.95)",
                border: "1px solid rgba(63,63,70,1)",
                borderRadius: 8,
                color: "#f4f4f5",
              }}
              labelFormatter={(label) => `Country: ${label}`}
            />
            <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} name="Leads" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
