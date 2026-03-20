"use client";

/**
 * Reusable card for partner institutions (e.g. clinics, hospitals).
 * Use for Trusted Clinical Network. Approved images can be passed via image prop.
 */
type PartnerInstitutionCardProps = {
  name: string;
  city: string;
  description: string;
  /** Optional: approved image URL. When null, placeholder is shown. */
  image?: string | null;
  /** Optional: partner website for "Learn More" link. */
  website?: string | null;
  /** Optional: specialty or tagline (e.g. "Oral health & dental", "General dentistry"). */
  specialty?: string | null;
};

export default function PartnerInstitutionCard({
  name,
  city,
  description,
  image,
  website,
  specialty,
}: PartnerInstitutionCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden transition hover:border-zinc-700">
      <div className="aspect-[16/10] w-full bg-zinc-800 relative">
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 to-transparent" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600 text-center px-4">
            <span className="text-sm font-medium">Institution image placeholder — add approved asset when ready</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{city}</p>
          {specialty && <p className="mt-0.5 text-sm text-zinc-300">{specialty}</p>}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold text-white">{name}</h3>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{description}</p>
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 rounded"
          >
            Learn More →
          </a>
        )}
      </div>
    </article>
  );
}
