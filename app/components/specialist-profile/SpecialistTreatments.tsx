type Props = {
  /** List of treatment names (dynamic per specialist). */
  treatments: string[];
};

const DEFAULT_TREATMENTS = [
  "Dental Implants",
  "Smile Design",
  "Oral Rehabilitation",
  "Cosmetic Dentistry",
  "Diagnostic Evaluation",
];

export default function SpecialistTreatments({ treatments }: Props) {
  const list = treatments.length > 0 ? treatments : DEFAULT_TREATMENTS;
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 md:p-10">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Treatments offered</h2>
      <p className="mb-8 text-2xl font-bold text-white md:text-3xl">Services and care</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {list.map((item, i) => (
          <li key={i} className="flex items-center gap-3 rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600/80 text-sm font-bold text-white">
              {i + 1}
            </span>
            <span className="text-white font-medium">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
