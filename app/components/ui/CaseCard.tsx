import Link from "next/link";
import StatusBadge from "./StatusBadge";

type Props = Readonly<{
  caseId: string;
  patientName: string;
  treatment: string;
  priority: string;
  status: string;
}>;

function priorityVariant(priority: string): "danger" | "warning" | "info" {
  if (priority === "urgent") return "danger";
  if (priority === "high") return "warning";
  return "info";
}

function statusVariant(status: string): "default" | "success" | "warning" | "info" {
  if (status === "completed") return "success";
  if (status === "requested") return "warning";
  return "info";
}

export default function CaseCard({ caseId, patientName, treatment, priority, status }: Props) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5 transition-colors hover:bg-zinc-800/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{patientName}</p>
          <p className="text-xs text-zinc-400">{treatment}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={priority} variant={priorityVariant(priority)} />
          <StatusBadge label={status} variant={statusVariant(status)} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/specialist/cases/${caseId}`} className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-emerald-950 hover:bg-emerald-400">
          View
        </Link>
        <Link href={`/specialist/cases/${caseId}`} className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800">
          Accept
        </Link>
        <Link href={`/specialist/cases/${caseId}`} className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800">
          Schedule
        </Link>
      </div>
    </article>
  );
}
