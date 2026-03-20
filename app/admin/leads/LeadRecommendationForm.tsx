"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { patchLeadById } from "./leadFormApi";

type PackageOption = { id: string; slug: string; name: string };

type Props = Readonly<{
  leadId: string;
  currentRecommendedSlug: string | null;
  packages: PackageOption[];
}>;

export default function LeadRecommendationForm({
  leadId,
  currentRecommendedSlug,
  packages,
}: Props) {
  const router = useRouter();
  const [slug, setSlug] = useState(currentRecommendedSlug ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await patchLeadById(
        leadId,
        { recommended_package_slug: slug.trim() || null },
        "Failed to save recommendation",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recommendation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="text-sm font-semibold text-zinc-100">Recommend package</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Choose the journey you want to recommend for this lead. This is for orientation; final treatment planning
        belongs to the specialist.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="min-w-[220px] rounded border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
          aria-label="Recommended package"
        >
          <option value="">— No recommended package —</option>
          {packages.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save recommendation"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {saving && <p className="mt-2 text-xs text-zinc-400">Loading...</p>}
    </form>
  );
}
