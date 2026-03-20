import Link from "next/link";
import type { ExperienceWithProvider } from "@/lib/experiences";

function formatPrice(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type Props = {
  experience: ExperienceWithProvider;
};

export default function MarketplaceExperienceCard({ experience }: Props) {
  const { name, city, category, description, price_cents, duration_hours, provider_name } = experience;

  return (
    <li className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 transition hover:border-zinc-600">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {provider_name && (
          <span className="text-xs font-medium text-zinc-500">{provider_name}</span>
        )}
        <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400 capitalize">
          {category}
        </span>
      </div>
      <h3 className="font-bold text-white">{name}</h3>
      <p className="mt-1 text-sm text-zinc-400">{city}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        {duration_hours != null && (
          <span className="text-zinc-300">{duration_hours}h</span>
        )}
        {price_cents != null && price_cents > 0 && (
          <span className="font-semibold text-emerald-400">
            From {formatPrice(price_cents)}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-3 line-clamp-2 text-sm text-zinc-400">{description}</p>
      )}
      <div className="mt-4">
        <Link
          href={`/assessment?experience=${encodeURIComponent(experience.id)}`}
          className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
        >
          Start Assessment
        </Link>
      </div>
    </li>
  );
}
