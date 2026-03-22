"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PublicServiceRow } from "@/lib/types/services-marketplace";

const TABS: { id: string; label: string; api?: string }[] = [
  { id: "all", label: "All" },
  { id: "lodging", label: "Lodging", api: "lodging" },
  { id: "transport", label: "Transport", api: "transport" },
  { id: "experience", label: "Experiences", api: "experience" },
  { id: "therapy", label: "Therapy", api: "therapy" },
];

function categoryGradient(category: string): string {
  switch (category) {
    case "lodging":
      return "from-violet-600/40 via-fuchsia-600/30 to-zinc-900";
    case "transport":
      return "from-sky-600/40 via-cyan-600/30 to-zinc-900";
    case "experience":
      return "from-amber-600/40 via-orange-600/30 to-zinc-900";
    case "therapy":
      return "from-emerald-600/40 via-teal-600/30 to-zinc-900";
    case "accompaniment":
      return "from-rose-600/40 via-pink-600/30 to-zinc-900";
    default:
      return "from-zinc-600/40 via-zinc-700/30 to-zinc-900";
  }
}

function formatPrice(cents: number, pricePer: string): string {
  const n = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  const per = pricePer.replace(/_/g, " ");
  return `from $${n} / ${per}`;
}

type MeResponse = { role?: string };

export default function ServicesMarketplace() {
  const [tab, setTab] = useState("all");
  const [services, setServices] = useState<PublicServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPatient, setIsPatient] = useState(false);

  const categoryParam = useMemo(() => {
    const row = TABS.find((t) => t.id === tab);
    return row?.api ?? "all";
  }, [tab]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = categoryParam === "all" ? "" : `?category=${encodeURIComponent(categoryParam)}`;
      const res = await fetch(`/api/services${q}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load");
      setServices(data.services ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [categoryParam]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          setIsPatient(false);
          return;
        }
        const data = (await res.json()) as MeResponse;
        const r = (data.role ?? "").toLowerCase();
        setIsPatient(r === "patient" || r === "user" || r === "admin");
      } catch {
        setIsPatient(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">SmileTripCare</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Services marketplace</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Curate lodging, transport, experiences, and wellness around your dental journey in Colombia.
          </p>
          <div className="mt-6">
            <label htmlFor="svc-search" className="sr-only">
              Search services
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
              <input
                id="svc-search"
                type="search"
                placeholder="Search by city or keyword (client filter)…"
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-900/80 py-3.5 pl-12 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                onChange={(e) => {
                  const q = e.target.value.toLowerCase().trim();
                  const root = document.getElementById("services-grid");
                  if (!root) return;
                  root.querySelectorAll<HTMLElement>("[data-service-card]").forEach((el) => {
                    const hay = (el.dataset.search ?? "").toLowerCase();
                    el.style.display = !q || hay.includes(q) ? "" : "none";
                  });
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto py-3 scrollbar-thin" aria-label="Categories">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error ? (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
        ) : null}
        {loading ? (
          <p className="text-sm text-zinc-500">Loading experiences…</p>
        ) : (
          <div
            id="services-grid"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {services.length === 0 && !error ? (
              <p className="col-span-full text-sm text-zinc-500">
                No services in this category yet. Check back soon or browse{" "}
                <button type="button" className="text-emerald-400 underline" onClick={() => setTab("all")}>
                  All
                </button>
                .
              </p>
            ) : null}
            {services.map((s) => {
              const cityLine = s.city || s.host_city || "Colombia";
              const searchBlob = `${s.name} ${s.description ?? ""} ${cityLine} ${s.category}`.toLowerCase();
              const tripHref = isPatient ? "/patient/trip" : `/login?next=${encodeURIComponent("/patient/trip")}`;
              return (
                <article
                  key={s.id}
                  data-service-card
                  data-search={searchBlob}
                  className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
                >
                  <div className={`relative h-36 bg-gradient-to-br ${categoryGradient(s.category)}`}>
                    <span className="absolute left-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                      {s.category}
                    </span>
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-xs text-amber-200 backdrop-blur">
                      ★ 5.0
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="text-lg font-bold text-white">{s.name}</h2>
                    <p className="mt-1 text-xs text-zinc-500">
                      {(s.host_name ?? "SmileTripCare partner") + " · " + cityLine}
                    </p>
                    {s.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{s.description}</p>
                    ) : null}
                    <p className="mt-3 text-sm font-semibold text-emerald-300">{formatPrice(s.price_cents, s.price_per)}</p>
                    <div className="mt-4 flex flex-1 flex-col justify-end gap-2">
                      <Link
                        href={`${tripHref}?addService=${encodeURIComponent(s.id)}`}
                        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                      >
                        Add to my trip
                      </Link>
                      <Link href="/patient" className="text-center text-xs text-zinc-500 hover:text-zinc-300">
                        Patient dashboard
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-600">
        <Link href="/" className="hover:text-zinc-400">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}
