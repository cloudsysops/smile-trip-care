const GALLERY_LABELS = [
  "Clinic",
  "Treatment rooms",
  "Doctors",
  "Environment",
  "City",
];

export default function SpecialistGallery() {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 md:p-10">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Gallery</h2>
      <p className="mb-8 text-2xl font-bold text-white md:text-3xl">Clinic, environment, and city</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GALLERY_LABELS.map((label, i) => (
          <div
            key={i}
            className="aspect-[4/3] w-full rounded-xl border border-zinc-700 bg-zinc-800/80 flex items-center justify-center text-zinc-500"
            role="img"
            aria-label={`Placeholder: ${label}`}
          >
            <span className="text-xs font-medium text-center px-3">[ {label} — approved image ]</span>
          </div>
        ))}
      </div>
    </section>
  );
}
