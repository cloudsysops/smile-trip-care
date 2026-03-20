"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = Readonly<{
  packageId: string;
  initialName: string;
  initialDescription: string | null;
  initialPublished: boolean;
}>;

export default function ProviderPackageEditForm({
  packageId,
  initialName,
  initialDescription,
  initialPublished,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [published, setPublished] = useState(initialPublished);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setPending(true);
    try {
      const res = await fetch("/api/provider/packages", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: packageId,
          name: name.trim(),
          description: description.trim() === "" ? null : description.trim(),
          published,
        }),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(j?.error ?? `Save failed (${res.status})`);
      }
      setMessage("Saved.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
      <div>
        <label htmlFor="pkg-name" className="block text-sm font-medium text-zinc-700">
          Name
        </label>
        <input
          id="pkg-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="pkg-desc" className="block text-sm font-medium text-zinc-700">
          Description
        </label>
        <textarea
          id="pkg-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-800">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
        />
        Published on marketplace
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {message ? <span className="text-sm text-zinc-600">{message}</span> : null}
      </div>
    </form>
  );
}
