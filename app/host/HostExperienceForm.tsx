"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const CATEGORIES = [
  "nature",
  "culture",
  "adventure",
  "wellness",
  "food",
  "recovery",
  "other",
] as const;

type Props = Readonly<{
  mode: "create" | "edit";
  experienceId?: string;
  initial?: {
    name: string;
    description: string | null;
    category: string | null;
    base_price_cents: number | null;
    city: string | null;
    published?: boolean;
  };
}>;

export default function HostExperienceForm({ mode, experienceId, initial }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(initial?.category ?? "other");
  const [priceUsd, setPriceUsd] = useState(
    initial?.base_price_cents != null ? String(initial.base_price_cents / 100) : "",
  );
  const [city, setCity] = useState(initial?.city ?? "");
  const [published, setPublished] = useState(initial?.published ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const usd = Number.parseFloat(priceUsd);
    if (!Number.isFinite(usd) || usd < 0) {
      setError("Enter a valid price (USD).");
      setSaving(false);
      return;
    }
    const base_price_cents = Math.round(usd * 100);
    try {
      if (mode === "create") {
        const res = await fetch("/api/host/experiences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            category,
            base_price_cents,
            city: city.trim(),
            published,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Could not create");
          return;
        }
        const id = data.experience?.id as string | undefined;
        router.push(id ? `/host/experiences/${id}` : "/host/experiences");
        router.refresh();
        return;
      }
      if (!experienceId) {
        setError("Missing experience id");
        return;
      }
      const res = await fetch(`/api/host/experiences/${experienceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category,
          base_price_cents,
          city: city.trim(),
          published,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-xl space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400" htmlFor="exp-name">
          Name
        </label>
        <input
          id="exp-name"
          required
          maxLength={300}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400" htmlFor="exp-desc">
          Description
        </label>
        <textarea
          id="exp-desc"
          rows={4}
          maxLength={5000}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400" htmlFor="exp-cat">
          Category
        </label>
        <select
          id="exp-cat"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-zinc-400" htmlFor="exp-price">
            Base price (USD)
          </label>
          <input
            id="exp-price"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            required
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
            value={priceUsd}
            onChange={(e) => setPriceUsd(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400" htmlFor="exp-city">
            City
          </label>
          <input
            id="exp-city"
            required
            maxLength={100}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        Published on marketplace
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {saving ? "Saving…" : mode === "create" ? "Create experience" : "Save changes"}
      </button>
    </form>
  );
}
