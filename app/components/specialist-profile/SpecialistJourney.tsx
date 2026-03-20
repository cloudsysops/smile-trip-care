const JOURNEY_STEPS = [
  { step: 1, title: "Free evaluation", body: "Share your details and goals. We review your case at no cost and recommend a personalized plan." },
  { step: 2, title: "Treatment recommendation", body: "Receive your treatment plan and next steps—no obligation." },
  { step: 3, title: "Travel coordination", body: "We coordinate lodging, transport, and your program so you focus on your care." },
  { step: 4, title: "Treatment", body: "Treatment with your specialist in a modern, professional setting." },
  { step: 5, title: "Recovery", body: "Supported recovery with optional experiences. We stay with you through the journey." },
];

export default function SpecialistJourney() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 md:p-10">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Patient journey</h2>
      <p className="mb-8 text-2xl font-bold text-white md:text-3xl">From evaluation to recovery</p>
      <ol className="space-y-6">
        {JOURNEY_STEPS.map(({ step, title, body }) => (
          <li key={step} className="flex gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">
              {step}
            </span>
            <div>
              <h3 className="font-bold text-white">{title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
