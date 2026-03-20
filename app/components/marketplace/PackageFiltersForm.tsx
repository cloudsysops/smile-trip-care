import type { PackageType } from "@/lib/packages";

const CITIES = ["Medellín", "Manizales"];
const PACKAGE_TYPES: { value: PackageType; label: string }[] = [
  { value: "health", label: "Health" },
  { value: "tour", label: "Tour" },
  { value: "combo", label: "Combo" },
];

type Props = {
  basePath: string;
  searchParams: {
    city?: string;
    type?: string;
    minPrice?: string;
    maxPrice?: string;
    minDuration?: string;
    maxDuration?: string;
  };
  showTypeFilter?: boolean;
};

export default function PackageFiltersForm({
  basePath,
  searchParams,
  showTypeFilter = true,
}: Props) {
  return (
    <form method="get" action={basePath} className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-500">City</span>
        <select
          name="city"
          defaultValue={searchParams.city ?? ""}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
      {showTypeFilter && (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500">Type</span>
          <select
            name="type"
            defaultValue={searchParams.type ?? ""}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All types</option>
            {PACKAGE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-500">Min price (USD)</span>
        <input
          type="number"
          name="minPrice"
          placeholder="0"
          min={0}
          defaultValue={searchParams.minPrice ?? ""}
          className="w-24 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-500">Max price (USD)</span>
        <input
          type="number"
          name="maxPrice"
          placeholder="—"
          min={0}
          defaultValue={searchParams.maxPrice ?? ""}
          className="w-24 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-500">Min days</span>
        <input
          type="number"
          name="minDuration"
          placeholder="0"
          min={0}
          defaultValue={searchParams.minDuration ?? ""}
          className="w-20 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-500">Max days</span>
        <input
          type="number"
          name="maxDuration"
          placeholder="—"
          min={0}
          defaultValue={searchParams.maxDuration ?? ""}
          className="w-20 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>
      <button
        type="submit"
        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
      >
        Apply filters
      </button>
    </form>
  );
}
