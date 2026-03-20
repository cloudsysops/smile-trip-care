import type { ExperienceRow } from "@/lib/experiences";

function formatPrice(cents: number | null): string {
  if (cents == null) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type Props = {
  experience: ExperienceRow;
};

export default function ExperienceCard({ experience }: Props) {
  const { name, city, category, description, price_cents, duration_hours } = experience;

  return (
    <li className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition hover:border-zinc-600">
      <h3 className="font-bold text-white">{name}</h3>
      <p className="mt-1 text-sm text-zinc-500">
        {city} · <span className="capitalize">{category}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {duration_hours != null && (
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-zinc-400">
            {duration_hours}h
          </span>
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
    </li>
  );
}
