type Step = {
  step: number;
  title: string;
  desc: string;
};

type Props = {
  steps: Step[];
  title?: string;
  className?: string;
};

export default function StepFlowSection({ steps, title = "How it works", className = "" }: Props) {
  return (
    <section id="how-it-works" className={`scroll-mt-6 ${className}`.trim()}>
      <h2 className="mb-8 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h2>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map(({ step, title: stepTitle, desc }) => (
          <li
            key={step}
            className="relative rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition hover:border-zinc-700"
          >
            <span
              className="absolute -top-2 -left-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-zinc-900"
              aria-hidden
            >
              {step}
            </span>
            <h3 className="mb-2 mt-1 font-bold text-white">{stepTitle}</h3>
            <p className="text-sm text-zinc-400">{desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
