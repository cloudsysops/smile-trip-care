type Props = {
  institutionName: string;
  location: string;
  description: string | null;
  /** Optional image URL; placeholder when null */
  imageUrl?: string | null;
};

export default function SpecialistClinic({ institutionName, location, description, imageUrl }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden">
      <h2 className="mb-2 px-8 pt-8 text-sm font-semibold uppercase tracking-wider text-zinc-500 md:pt-10">
        Clinic / Institution
      </h2>
      <p className="px-8 text-2xl font-bold text-white md:text-3xl">Trusted partner institution</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-start">
        <div className="px-8 pb-8 md:pb-10">
          <h3 className="font-bold text-white">{institutionName}</h3>
          <p className="mt-1 text-sm font-medium text-emerald-400">{location}</p>
          {description && <p className="mt-4 text-sm text-zinc-400 leading-relaxed">{description}</p>}
          {!description && (
            <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
              Part of our curated network of trusted institutions. Professional facilities and patient-centered care for international patients.
            </p>
          )}
        </div>
        <div className="aspect-video md:aspect-[4/3] bg-zinc-800 flex items-center justify-center">
          {imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            </>
          ) : (
            <span className="text-center text-sm text-zinc-500 px-4">Institution image placeholder — approved asset can be added here</span>
          )}
        </div>
      </div>
    </section>
  );
}
