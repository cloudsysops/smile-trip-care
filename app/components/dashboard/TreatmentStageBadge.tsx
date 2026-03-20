"use client";

export type ProgressStatus = "active" | "completed" | "cancelled";

type Props = Readonly<{
  stageLabel: string;
  status?: ProgressStatus | null;
}>;

export default function TreatmentStageBadge({ stageLabel, status }: Props) {
  const statusStyle =
    status === "completed"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
      : status === "cancelled"
        ? "bg-zinc-700/20 text-zinc-300 border-zinc-700/30"
        : "bg-sky-500/10 text-sky-300 border-sky-500/30";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}
    >
      {stageLabel}
    </span>
  );
}
