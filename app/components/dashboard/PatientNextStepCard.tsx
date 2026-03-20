"use client";

import { getOrderedStageKeys, getStageLabel } from "@/lib/clinical/stages";
import TreatmentStageBadge from "./TreatmentStageBadge";

export type LatestProgress = Readonly<{
  stage_key: string;
  stage_label: string;
  status: string;
  notes: string | null;
}> | null;

type Props = Readonly<{
  latest: LatestProgress;
}>;

export default function PatientNextStepCard({ latest }: Props) {
  const keys = getOrderedStageKeys();
  const currentIndex = latest
    ? keys.indexOf(latest.stage_key as (typeof keys)[number])
    : -1;
  const nextKey = currentIndex >= 0 && currentIndex < keys.length - 1
    ? keys[currentIndex + 1]
    : null;
  const nextLabel = nextKey ? getStageLabel(nextKey) : null;

  if (!latest) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Next step
        </h3>
        <p className="mt-2 text-sm text-zinc-400">
          Your care team will update your progress here after your assessment is reviewed.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Current stage
      </h3>
      <div className="mt-2">
        <TreatmentStageBadge
          stageLabel={latest.stage_label}
          status={latest.status as "active" | "completed" | "cancelled"}
        />
      </div>
      {latest.notes?.trim() ? (
        <p className="mt-3 text-sm text-zinc-300">{latest.notes}</p>
      ) : null}
      {nextLabel ? (
        <>
          <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Next step
          </h4>
          <p className="mt-1 text-sm font-medium text-zinc-100">{nextLabel}</p>
        </>
      ) : (
        <p className="mt-4 text-sm font-medium text-emerald-300">
          You&apos;re at the final stage. Your care team will confirm next steps.
        </p>
      )}
    </section>
  );
}
