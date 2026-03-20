import Link from "next/link";
import type { PackageRow } from "@/lib/packages";
import type { PublicAsset } from "@/lib/assets";

function formatDeposit(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function journeyTypeLabel(pkg: PackageRow): string {
  const t = pkg.package_type ?? pkg.type;
  if (t === "health") return "Health";
  if (t === "tour") return "Tour & recovery";
  if (t === "combo") return "Treatment + recovery";
  return "Package";
}

/** Treatment / evaluation / recovery city line for display */
function citiesLine(pkg: PackageRow): string {
  if (pkg.origin_city && pkg.destination_city) {
    return `${pkg.origin_city} → ${pkg.destination_city}`;
  }
  if (pkg.recovery_city) {
    return `Treatment: ${pkg.location} · Recovery: ${pkg.recovery_city}`;
  }
  return pkg.location;
}

const CTA_CLASS =
  "inline-block w-full min-h-[48px] rounded-full py-3 text-center text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950";

type Props = {
  pkg: PackageRow;
  image: PublicAsset | null;
  featured?: boolean;
  recommended?: boolean;
};

export default function PackageCard({ pkg, image, featured = false, recommended = false }: Props) {
  const cities = citiesLine(pkg);
  const journeyType = journeyTypeLabel(pkg);
  const listItems = Array.isArray(pkg.highlights) && pkg.highlights.length > 0
    ? pkg.highlights
    : Array.isArray(pkg.included) ? pkg.included : [];
  const badgeLabel = pkg.badge ?? (recommended ? "Most Popular" : null);
  const recoveryFocused = pkg.recovery_city != null || pkg.package_type === "combo" || pkg.package_type === "tour";
  const secondaryBadge = !badgeLabel && recoveryFocused ? "Recovery focused" : null;

  return (
    <li
      className={`flex flex-col overflow-hidden rounded-2xl border bg-zinc-900/90 transition hover:border-zinc-600 ${
        recommended ? "border-emerald-500/60 ring-2 ring-emerald-500/30" : "border-zinc-800 hover:border-zinc-700"
      }`}
    >
      <div className={`relative overflow-hidden bg-zinc-800 ${featured ? "aspect-[16/10]" : "aspect-video"}`}>
        {image?.url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={image.url}
            alt={image.alt_text ?? pkg.name}
            className="h-full w-full object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-500">
            <span className="text-sm font-medium">{cities}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-zinc-900/95 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            {journeyType}
          </span>
          {badgeLabel && (
            <span className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-zinc-900">
              {badgeLabel}
            </span>
          )}
          {secondaryBadge && (
            <span className="rounded-full bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white">
              {secondaryBadge}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1 text-xl font-bold tracking-tight text-white">{pkg.title ?? pkg.name}</h3>
        {(pkg.subtitle ?? pkg.description) && (
          <p className="mb-3 line-clamp-2 text-sm text-zinc-400">{pkg.subtitle ?? pkg.description}</p>
        )}
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          {cities}
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {pkg.duration_days != null && (
            <span className="text-sm font-medium text-zinc-300">{pkg.duration_days} days</span>
          )}
          <span className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-sm font-bold text-emerald-400 ring-1 ring-emerald-500/40">
            Deposit {formatDeposit(pkg.deposit_cents)}
          </span>
        </div>
        {listItems.length > 0 && (
          <ul className="mb-4 space-y-1.5 text-xs text-zinc-400">
            {listItems.slice(0, 4).map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-emerald-500" aria-hidden>✓</span>
                {typeof item === "string" ? item : String(item)}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto">
          <Link
            href={`/assessment?package=${encodeURIComponent(pkg.slug)}`}
            className={`${CTA_CLASS} ${
              recommended
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-white text-zinc-900 hover:bg-zinc-200"
            }`}
          >
            Start with this package
          </Link>
        </div>
      </div>
    </li>
  );
}
