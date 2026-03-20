"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = Readonly<{
  packageId: string;
  initialPublished: boolean;
}>;

export default function PackagePublishedToggle({ packageId, initialPublished }: Props) {
  const router = useRouter();
  const [published, setPublished] = useState(initialPublished);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setError(null);
    const next = !published;
    setPending(true);
    try {
      const res = await fetch("/api/provider/packages", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: packageId, published: next }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `Update failed (${res.status})`);
      }
      setPublished(next);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => void toggle()}
        className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
          published
            ? "border-emerald-600/50 bg-emerald-500/10 text-emerald-800"
            : "border-zinc-300 bg-zinc-100 text-zinc-700"
        }`}
      >
        {pending ? "…" : published ? "Published" : "Unpublished"}
      </button>
      {error ? <span className="max-w-[12rem] text-right text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
