"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ItineraryItemRow } from "@/lib/patient-itinerary";
import { tripDayFromScheduled } from "@/lib/trip-dates";
import type { PublicServiceRow } from "@/lib/services/marketplace-services";

type Props = Readonly<{
  leadId: string;
  anchorDate: string;
  initialItems: ItineraryItemRow[];
  presetServiceId?: string;
}>;

const DAY_SLOTS: { day: number; title: string; subtitle: string }[] = [
  { day: 0, title: "Day 0 — Arrival", subtitle: "Airport transfer & check-in" },
  { day: 1, title: "Day 1 — Treatment", subtitle: "Primary clinical day" },
  { day: 2, title: "Day 2 — Treatment / follow-up", subtitle: "Clinical or adjustments" },
  { day: 3, title: "Day 3 — Recovery", subtitle: "Rest & local support" },
  { day: 4, title: "Day 4 — Recovery", subtitle: "Light activities" },
  { day: 5, title: "Day 5 — Departure", subtitle: "Outbound transfer" },
];

function money(cents: number | null | undefined): string {
  const n = typeof cents === "number" && Number.isFinite(cents) ? cents : 0;
  return `$${(n / 100).toFixed(n % 100 === 0 ? 0 : 2)}`;
}

export default function PatientTripBuilder({ leadId, anchorDate, initialItems, presetServiceId }: Props) {
  const [items, setItems] = useState<ItineraryItemRow[]>(initialItems);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelDay, setPanelDay] = useState(0);
  const [services, setServices] = useState<PublicServiceRow[]>([]);
  const [loadingPanel, setLoadingPanel] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/patient/itinerary", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items ?? []);
  }, []);

  const openPanel = useCallback(
    async (day: number) => {
      setPanelDay(day);
      setPanelOpen(true);
      setLoadingPanel(true);
      try {
        const res = await fetch("/api/services", { cache: "no-store" });
        const data = await res.json();
        setServices(data.services ?? []);
      } finally {
        setLoadingPanel(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!presetServiceId) return;
    void (async () => {
      setPanelDay(0);
      setPanelOpen(true);
      setLoadingPanel(true);
      try {
        const res = await fetch("/api/services", { cache: "no-store" });
        const data = await res.json();
        setServices(data.services ?? []);
      } finally {
        setLoadingPanel(false);
      }
    })();
  }, [presetServiceId]);

  const addService = async (serviceId: string, day: number) => {
    setAddingId(serviceId);
    try {
      const res = await fetch("/api/patient/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: leadId, service_id: serviceId, trip_day: day }),
      });
      if (!res.ok) return;
      await refresh();
      setPanelOpen(false);
    } finally {
      setAddingId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setRemovingId(itemId);
    try {
      const res = await fetch(`/api/patient/itinerary?id=${encodeURIComponent(itemId)}`, { method: "DELETE" });
      if (!res.ok) return;
      await refresh();
    } finally {
      setRemovingId(null);
    }
  };

  const itemsByDay = useMemo(() => {
    const map = new Map<number, ItineraryItemRow[]>();
    const unscheduled: ItineraryItemRow[] = [];
    for (const it of items) {
      const d = tripDayFromScheduled(it.scheduled_date, anchorDate);
      if (d === null || d < 0 || d > 10) {
        unscheduled.push(it);
        continue;
      }
      const list = map.get(d) ?? [];
      list.push(it);
      map.set(d, list);
    }
    return { map, unscheduled };
  }, [items, anchorDate]);

  const totalCents = useMemo(
    () => items.reduce((s, it) => s + (typeof it.price_cents === "number" ? it.price_cents : 0), 0),
    [items],
  );

  return (
    <>
      <main className="mx-auto max-w-6xl gap-6 px-3 py-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start sm:px-6 sm:py-8">
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Trip anchor date</p>
            <p className="mt-1 text-lg font-semibold text-white">{anchorDate}</p>
            <p className="mt-1 text-xs text-zinc-500">
              We schedule add-ons relative to this date (from your booking or assessment). Your coordinator can adjust.
            </p>
          </div>

          {DAY_SLOTS.map((slot) => {
            const dayItems = itemsByDay.map.get(slot.day) ?? [];
            return (
              <section
                key={slot.day}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">{slot.title}</h2>
                    <p className="text-xs text-zinc-500">{slot.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void openPanel(slot.day)}
                    className="shrink-0 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
                  >
                    + Add service
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {dayItems.length === 0 ? (
                    <p className="text-sm text-zinc-500">No add-ons yet for this day.</p>
                  ) : (
                    dayItems.map((it) => (
                      <article
                        key={it.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-100">{it.title}</p>
                          <p className="text-xs text-zinc-500">
                            {it.item_type} · {money(it.price_cents)}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={removingId === it.id}
                          onClick={() => void removeItem(it.id)}
                          className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          {removingId === it.id ? "…" : "Remove"}
                        </button>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}

          {itemsByDay.unscheduled.length > 0 ? (
            <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-amber-200">Unscheduled</h2>
              <p className="text-xs text-amber-200/70">These items don&apos;t match the current anchor window.</p>
              <div className="mt-3 space-y-2">
                {itemsByDay.unscheduled.map((it) => (
                  <article
                    key={it.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{it.title}</p>
                      <p className="text-xs text-zinc-500">{it.scheduled_date ?? "—"}</p>
                    </div>
                    <button
                      type="button"
                      disabled={removingId === it.id}
                      onClick={() => void removeItem(it.id)}
                      className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="mt-6 space-y-4 lg:sticky lg:top-6 lg:mt-0">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Add services</h3>
            <p className="mt-2 text-sm text-zinc-300">
              Browse the marketplace and attach lodging, transport, experiences, and therapy to each day.
            </p>
            <Link
              href="/services"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Open marketplace
            </Link>
            <button
              type="button"
              onClick={() => void openPanel(0)}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20"
            >
              Quick add (Day 0)
            </button>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs text-zinc-500">Estimated add-ons total</p>
            <p className="mt-1 text-2xl font-bold text-white">{money(totalCents)}</p>
            <p className="mt-1 text-xs text-zinc-500">{items.length} line{items.length === 1 ? "" : "s"}</p>
          </div>
        </aside>
      </main>

      {panelOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">Add to trip</p>
                <p className="text-xs text-zinc-500">Day {panelDay} · {DAY_SLOTS.find((d) => d.day === panelDay)?.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-lg px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {loadingPanel ? (
                <p className="text-sm text-zinc-500">Loading services…</p>
              ) : (
                <ul className="space-y-2">
                  {services.map((s) => (
                    <li
                      key={s.id}
                      className={`rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 ${
                        presetServiceId === s.id ? "ring-2 ring-emerald-500/50" : ""
                      }`}
                    >
                      <p className="font-medium text-zinc-100">{s.name}</p>
                      <p className="text-xs text-zinc-500">
                        {s.host_name ?? "Partner"} · {s.city ?? s.host_city ?? "—"}
                      </p>
                      <p className="mt-1 text-sm text-emerald-300">
                        ${(s.price_cents / 100).toFixed(0)} / {s.price_per}
                      </p>
                      <button
                        type="button"
                        disabled={addingId === s.id}
                        onClick={() => void addService(s.id, panelDay)}
                        className="mt-2 w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {addingId === s.id ? "Adding…" : `Add to Day ${panelDay}`}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
