"use client";

type PartnerCardProps = {
  name: string;
  city: string;
  description: string;
  /** Optional: when approved asset is available, pass URL. Otherwise placeholder is shown. */
  imageUrl?: string | null;
  /** Optional short tagline or specialty (e.g. "Oral health & dental") */
  tagline?: string | null;
  /** Optional: link to partner site or contact. Not required for trust display. */
  websiteUrl?: string | null;
};

export default function PartnerCard({ name, city, description, imageUrl, tagline, websiteUrl }: PartnerCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/80 overflow-hidden transition hover:border-zinc-700">
      <div className="aspect-[16/10] w-full bg-zinc-800 relative">
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 to-transparent" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-600">
            <span className="text-sm font-medium">Partner image placeholder — approved asset can be added here</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">{city}</p>
          {tagline && <p className="mt-0.5 text-sm text-zinc-300">{tagline}</p>}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-lg font-bold text-white">{name}</h3>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{description}</p>
        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 rounded"
          >
            Visit website →
          </a>
        )}
      </div>
    </article>
  );
}
