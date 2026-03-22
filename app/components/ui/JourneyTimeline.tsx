type Step = {
  id: string;
  title: string;
  subtitle: string;
  date?: string | null;
  status: "completed" | "active" | "pending";
  icon: string;
};

export default function JourneyTimeline({ steps }: { steps: Step[] }) {
  return (
    <div className="space-y-4">
      {steps.map((step, idx) => {
        const done = step.status === "completed";
        const active = step.status === "active";
        return (
          <div key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${
                  done
                    ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                    : active
                      ? "border-emerald-400/70 bg-zinc-800 text-emerald-300"
                      : "border-zinc-700 bg-zinc-900 text-zinc-500"
                }`}
              >
                {step.icon}
              </div>
              {idx < steps.length - 1 ? (
                <div className={`mt-1 h-8 w-px ${done ? "bg-emerald-500/40" : "bg-zinc-700"}`} />
              ) : null}
            </div>
            <div className="pb-2">
              <p className="text-sm font-semibold text-white">{step.title}</p>
              <p className="text-sm text-zinc-400">{step.subtitle}</p>
              {step.date ? <p className="text-xs text-zinc-500">{step.date}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
