type Props = Readonly<{
  value: number;
  suffix?: string;
  positiveIsGood?: boolean;
}>;

export default function TrendBadge({ value, suffix = "%", positiveIsGood = true }: Props) {
  const isPositive = value >= 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  const color = isGood
    ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
    : "text-red-300 border-red-500/30 bg-red-500/10";
  const arrow = isPositive ? "↑" : "↓";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${color}`}>
      {arrow} {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}
