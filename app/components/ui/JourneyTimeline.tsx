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
                    ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                    : active
                      ? "border-emerald-300 bg-white text-emerald-600"
                      : "border-zinc-300 bg-zinc-100 text-zinc-500"
                }`}
              >
                {step.icon}
              </div>
              {idx < steps.length - 1 ? <div className={`mt-1 h-8 w-px ${done ? "bg-emerald-300" : "bg-zinc-300"}`} /> : null}
            </div>
            <div className="pb-2">
              <p className="text-sm font-semibold text-zinc-900">{step.title}</p>
              <p className="text-sm text-zinc-600">{step.subtitle}</p>
              {step.date ? <p className="text-xs text-zinc-500">{step.date}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
