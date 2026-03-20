"use client";

import Link from "next/link";

export type RecommendedDoctorCardProps = Readonly<{
  name: string;
  clinic: string | null;
  city: string;
  specialty: string;
  yearsOfExperience?: number | null;
  photoUrl?: string | null;
  slug?: string | null;
}>;

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function RecommendedDoctorCard({
  name,
  clinic,
  city,
  specialty,
  yearsOfExperience,
  photoUrl,
  slug,
}: RecommendedDoctorCardProps) {
  const displayClinic = clinic?.trim() ?? null;
  const content = (
    <>
      <div className="relative flex h-36 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-800 sm:h-40 sm:w-32">
        {photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={photoUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/90 text-xl font-bold text-white sm:h-16 sm:w-16 sm:text-2xl"
            aria-hidden
          >
            {getInitials(name)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-white">{name}</h3>
        <p className="mt-0.5 text-sm font-medium text-emerald-400">{specialty}</p>
        {displayClinic && (
          <p className="mt-1 text-sm text-zinc-400">{displayClinic}</p>
        )}
        <p className="mt-0.5 text-xs text-zinc-500">{city}</p>
        {yearsOfExperience != null && yearsOfExperience > 0 && (
          <p className="mt-2 text-xs text-zinc-500">
            {yearsOfExperience} {yearsOfExperience === 1 ? "year" : "years"} of experience
          </p>
        )}
        {slug && (
          <p className="mt-2 text-sm font-medium text-emerald-400">View profile →</p>
        )}
      </div>
    </>
  );

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-zinc-700 bg-zinc-900/80 p-5 transition hover:border-zinc-600 sm:flex-row sm:items-center sm:gap-6">
      {slug ? (
        <Link
          href={`/specialists/${slug}`}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 rounded-xl"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </article>
  );
}
