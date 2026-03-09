type Props = {
  /** Short description (from specialist.description) */
  description: string | null;
  /** Long-form bio (from specialist.bio) */
  bio: string | null;
  /** Specialist name for fallback copy */
  name: string;
};

export default function SpecialistAbout({ description, bio, name }: Props) {
  const mainCopy = bio ?? description ?? null;
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 md:p-10">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">About the specialist</h2>
      <p className="mb-6 text-2xl font-bold text-white md:text-3xl">Experience and focus on international patients</p>
      <div className="prose prose-invert max-w-none text-zinc-400">
        {mainCopy ? (
          <p className="leading-relaxed">{mainCopy}</p>
        ) : (
          <>
            <p className="leading-relaxed">
              {name} is part of the MedVoyage Smile curated network of trusted specialists. Our partners are selected for their experience, professional standards, and focus on international patients seeking quality oral health and dental care in Colombia.
            </p>
            <p className="mt-4 leading-relaxed">
              From free evaluation to treatment and recovery, we coordinate your journey so you can focus on your care. All specialists in our network work with licensed institutions and maintain a commitment to patient comfort and outcomes.
            </p>
          </>
        )}
        <p className="mt-6 text-sm text-zinc-500">
          This profile is part of a curated network—not an open marketplace. MedVoyage Smile connects you with vetted specialists and coordinates your experience from evaluation through recovery.
        </p>
      </div>
    </section>
  );
}
