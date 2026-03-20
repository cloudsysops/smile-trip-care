"use client";

import { useMemo, useState } from "react";
import { WhatsAppButton } from "@/app/components/WhatsAppButton";
import { calculateBuilderEstimate, groupBuilderItemsByCategory, type BuilderItem } from "@/lib/services/package-builder.service";

type Props = {
  items: BuilderItem[];
  grouped: ReturnType<typeof groupBuilderItemsByCategory>;
  slug: string;
  packageName: string;
};

function formatPrice(cents: number): string {
  if (!cents || cents <= 0) return "Included";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function BuilderClient({ items, grouped, slug, packageName }: Readonly<Props>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const estimate = useMemo(
    () => calculateBuilderEstimate(items, selectedIds),
    [items, selectedIds],
  );

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const hasItems = items.length > 0;

  return (
    <>
      <section className="space-y-6">
        {!hasItems && (
          <p className="text-sm text-zinc-400">
            This package doesn&apos;t have structured items yet. Your coordinator will walk you through available
            options during assessment.
          </p>
        )}
        {hasItems &&
          (["clinic", "lodging", "transport", "tour", "food", "other"] as const).map((cat) => {
            const list = grouped[cat];
            if (!list || list.length === 0) return null;
            const label =
              cat === "clinic"
                ? "Clinical care & coordination"
                : cat === "lodging"
                  ? "Lodging"
                  : cat === "transport"
                    ? "Transport"
                    : cat === "tour"
                      ? "Tours & experiences"
                      : cat === "food"
                        ? "Meals"
                        : "Other";
            return (
              <div key={cat} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">{label}</h2>
                <ul className="mt-3 space-y-3">
                  {list.map((item) => {
                    const isSelected = selectedIds.includes(item.id);
                    const mustInclude = item.includedByDefault;
                    return (
                      <li key={item.id} className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-100">
                            {item.name}
                            {item.city && <span className="ml-2 text-xs text-zinc-500">· {item.city}</span>}
                          </p>
                          {item.description && (
                            <p className="mt-0.5 text-xs text-zinc-400">{item.description}</p>
                          )}
                          <p className="mt-1 text-xs text-emerald-400">
                            {mustInclude ? "Included in base package" : "Optional add-on"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm font-semibold text-zinc-100">{formatPrice(item.priceCents)}</span>
                          {mustInclude ? (
                            <span className="rounded-full border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                              Always included
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggle(item.id)}
                              className={
                                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium " +
                                (isSelected
                                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                                  : "border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:border-zinc-500")
                              }
                            >
                              {isSelected ? "Remove" : "Add"}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
      </section>
      <aside className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Summary</h2>
        <p className="text-sm font-medium text-zinc-100">{packageName}</p>
        <div className="mt-3 space-y-1 text-sm text-zinc-300">
          {estimate.items.length === 0 ? (
            <p className="text-zinc-400 text-xs">
              Once items are available for this package, you&apos;ll see a detailed breakdown here.
            </p>
          ) : (
            estimate.items.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-zinc-300">
                  {i.name}
                  {i.included && <span className="ml-1 text-[10px] text-emerald-400">(included)</span>}
                </span>
                <span className="text-zinc-100">{formatPrice(i.priceCents)}</span>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 space-y-1 border-t border-zinc-800 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Estimated total</span>
            <span className="font-semibold text-white">{formatPrice(estimate.totalCents)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Estimated deposit</span>
            <span className="font-semibold text-emerald-400">{formatPrice(estimate.depositCents)}</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Final pricing is confirmed after clinical review. No payment is required until you approve your treatment
            plan and deposit.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            const url = new URL(window.location.origin + "/assessment");
            url.searchParams.set("package", slug);
            url.searchParams.set("builder", "1");
            window.location.href = url.toString();
          }}
          className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
        >
          Continue to assessment
        </button>
        <div className="mt-3 flex flex-col gap-2">
          <WhatsAppButton
            message={`Hi, I'm looking at the ${packageName} package and I'd like help customizing my dental + travel plan.`}
            className="w-full justify-center"
          />
          <p className="text-[11px] text-zinc-500">
            Prefer WhatsApp? Tap to chat directly with a coordinator about this package.
          </p>
        </div>
      </aside>
    </>
  );
}

