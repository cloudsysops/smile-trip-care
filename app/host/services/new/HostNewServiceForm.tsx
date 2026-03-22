"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  ["lodging", "Lodging"],
  ["transport", "Transport"],
  ["experience", "Experience"],
  ["therapy", "Therapy"],
  ["accompaniment", "Accompaniment"],
  ["other", "Other"],
] as const;

export default function HostNewServiceForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim() || null;
    const category = String(fd.get("category") ?? "other");
    const priceUsd = Number(String(fd.get("price_usd") ?? "0"));
    const price_cents = Math.max(0, Math.round(priceUsd * 100));
    const city = String(fd.get("city") ?? "").trim() || null;
    const durationRaw = String(fd.get("duration_hours") ?? "").trim();
    const duration_hours = durationRaw === "" ? null : Number(durationRaw);
    const maxRaw = String(fd.get("max_capacity") ?? "").trim();
    const max_capacity = maxRaw === "" ? null : Number.parseInt(maxRaw, 10);

    if (!name) {
      setError("Name is required");
      return;
    }
    if (!Number.isFinite(priceUsd) || priceUsd < 0) {
      setError("Invalid price");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/host/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category,
          price_cents,
          price_per: "person",
          city,
          duration_hours: duration_hours != null && Number.isFinite(duration_hours) ? duration_hours : null,
          max_capacity: max_capacity != null && Number.isFinite(max_capacity) ? max_capacity : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Save failed");
        return;
      }
      router.push("/host/services");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
      {error ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      <div>
        <label htmlFor="name" className="block text-xs font-medium text-zinc-400">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-xs font-medium text-zinc-400">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-xs font-medium text-zinc-400">
          Category
        </label>
        <select
          id="category"
          name="category"
          className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        >
          {CATEGORIES.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="price_usd" className="block text-xs font-medium text-zinc-400">
          Price (USD)
        </label>
        <input
          id="price_usd"
          name="price_usd"
          type="number"
          min={0}
          step={0.01}
          defaultValue={0}
          className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label htmlFor="city" className="block text-xs font-medium text-zinc-400">
          City
        </label>
        <input id="city" name="city" className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="duration_hours" className="block text-xs font-medium text-zinc-400">
            Duration (hours)
          </label>
          <input
            id="duration_hours"
            name="duration_hours"
            type="number"
            min={0}
            step={0.5}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label htmlFor="max_capacity" className="block text-xs font-medium text-zinc-400">
            Max capacity
          </label>
          <input
            id="max_capacity"
            name="max_capacity"
            type="number"
            min={1}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save service"}
      </button>
    </form>
  );
}
