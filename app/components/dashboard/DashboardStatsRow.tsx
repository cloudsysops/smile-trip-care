"use client";

export type SparkData = { day: string; value: number };

export type DashboardStatCard = {
  label: string;
  /** Numeric value (e.g. for sparkline scaling); use `displayValue` for formatted text. */
  value: number;
  displayValue?: string;
  trend: number;
  spark: SparkData[];
  accent: string;
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

const CARD =
  "min-w-0 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 transition-colors hover:bg-zinc-800/60";
const LABEL = "text-[10px] font-semibold uppercase tracking-wider text-zinc-400 sm:text-xs";

export function DashboardStatsRow({ cards }: { cards: DashboardStatCard[] }) {
  return (
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className={CARD}>
          <p className={LABEL}>{card.label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white sm:mt-2 sm:text-3xl">
            {card.displayValue ?? card.value}
          </p>
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
