import Link from "next/link";
import type { PackageWithProvider } from "@/lib/packages";

function formatMoney(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type Props = {
  pkg: PackageWithProvider;
};

export default function MarketplacePackageCard({ pkg }: Props) {
  const cities = [pkg.location, pkg.recovery_city].filter(Boolean);
  const cityLabel = cities.length > 1 ? `${pkg.location} → ${pkg.recovery_city}` : pkg.location;

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-lg shadow-black/20 transition hover:border-zinc-600 hover:shadow-xl hover:shadow-black/25">
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {pkg.provider_name && (
            <span className="text-xs font-medium text-zinc-500">{pkg.provider_name}</span>
          )}
          {(pkg.featured === true) && (
            <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
              Featured
            </span>
          )}
          <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400 capitalize">
            {pkg.type ?? "health"}
          </span>
        </div>
        <h3 className="mb-2 text-lg font-bold text-white">{pkg.name}</h3>
        <p className="mb-3 text-sm text-zinc-400">
          {cityLabel}
        </p>
        <div className="mb-3 flex flex-wrap gap-3 text-sm">
          {pkg.duration_days != null && (
            <span className="font-medium text-zinc-300">{pkg.duration_days} days</span>
          )}
          {(pkg.price_cents != null && pkg.price_cents > 0) && (
            <span className="font-semibold text-white">
              From {formatMoney(pkg.price_cents)}
            </span>
          )}
          {pkg.deposit_cents != null && (
            <span className="text-emerald-400">
              Deposit {formatMoney(pkg.deposit_cents)}
            </span>
          )}
        </div>
        {pkg.description && (
          <p className="mb-3 line-clamp-2 text-sm text-zinc-400">{pkg.description}</p>
        )}
        {Array.isArray(pkg.included) && pkg.included.length > 0 && (
          <ul className="mb-4 space-y-1 text-xs text-zinc-400">
            {pkg.included.slice(0, 4).map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-emerald-500" aria-hidden>✓</span>
                {item}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/packages/${encodeURIComponent(pkg.slug)}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-zinc-600 bg-transparent px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            View Package
          </Link>
          <Link
            href={`/assessment?package=${encodeURIComponent(pkg.slug)}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            Start Assessment
          </Link>
        </div>
      </div>
    </li>
  );
}
