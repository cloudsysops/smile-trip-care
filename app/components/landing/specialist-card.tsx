import Link from "next/link";
import type { SpecialistRow } from "@/lib/specialists";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type Props = {
  specialist: SpecialistRow;
  imageUrl?: string | null;
};

export default function SpecialistCard({ specialist, imageUrl }: Props) {
  const { name, specialty, city, clinic, description, slug } = specialist;

  const content = (
    <>
      <div className="relative flex h-40 items-center justify-center bg-zinc-800">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600/80 text-2xl font-bold text-white"
            aria-hidden
          >
            {getInitials(name)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold text-white">{name}</h3>
        <p className="mt-0.5 text-sm font-medium text-emerald-400">{specialty}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {city}
          {clinic ? ` · ${clinic}` : ""}
        </p>
        {description && (
          <p className="mt-3 line-clamp-2 text-sm text-zinc-400">{description}</p>
        )}
        <p className="mt-3 text-xs font-medium text-emerald-400/90">
          Free evaluation included in your visit.
        </p>
      </div>
    </>
  );

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 transition hover:border-zinc-600">
      {slug ? (
        <Link href={`/specialists/${slug}`} className="flex flex-col flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset rounded-2xl">
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}
