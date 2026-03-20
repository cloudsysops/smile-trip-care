type StepStatus = "completed" | "current" | "upcoming";

type TimelineStep = Readonly<{
  id: string;
  label: string;
  status: StepStatus;
  detail?: string | null;
}>;

type Props = Readonly<{
  steps: readonly TimelineStep[];
}>;

function getStepPlaceholder(stepId: string): string {
  const placeholders: Record<string, string> = {
    consultation: "Scheduled after your assessment is reviewed",
    travel: "Confirmed after deposit",
    procedure: "At your partner clinic",
    recovery: "Guided by your specialist",
    "follow-up": "Post-recovery check with your coordinator",
  };
  return placeholders[stepId] ?? "Part of your journey";
}

export default function TreatmentTimelineSection({ steps }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Treatment timeline</h3>
      <p className="mt-1 text-sm text-zinc-400">Your journey from consultation to follow-up</p>
      <ol className="mt-6 space-y-0" role="list">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";
          return (
            <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
              {!isLast && (
                <span
                  className="absolute left-[11px] top-6 -bottom-2 w-0.5 bg-zinc-800"
                  aria-hidden
                />
              )}
              <span
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                  isCompleted
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isCurrent
                      ? "border-emerald-400 bg-emerald-500/10 text-emerald-300 ring-4 ring-emerald-500/20"
                      : "border-zinc-700 bg-zinc-900 text-zinc-500"
                }`}
                aria-hidden
              >
                {isCompleted ? "✓" : index + 1}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={`font-medium ${
                    isCurrent ? "text-zinc-100" : isCompleted ? "text-zinc-300" : "text-zinc-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-sm text-zinc-500">
                  {step.detail?.trim() || getStepPlaceholder(step.id)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
