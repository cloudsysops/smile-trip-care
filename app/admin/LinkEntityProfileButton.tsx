"use client";

import { useState } from "react";

type ProfileSearchRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  provider_id: string | null;
  specialist_id: string | null;
};

type Props = Readonly<{
  entityId: string;
  entityLabel: string;
  endpoint: string;
  currentLinkedEmail?: string | null;
}>;

export default function LinkEntityProfileButton({
  entityId,
  entityLabel,
  endpoint,
  currentLinkedEmail,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProfileSearchRow[]>([]);

  async function runSearch() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/profiles/search?email=${encodeURIComponent(query)}`, {
        method: "GET",
      });
      const data = (await res.json().catch(() => ({}))) as { data?: ProfileSearchRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Search failed");
        setResults([]);
        return;
      }
      setResults(Array.isArray(data.data) ? data.data : []);
    } catch {
      setError("Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function linkProfile(profileId: string) {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not link profile");
        return;
      }
      globalThis.location.reload();
    } catch {
      setError("Could not link profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
      >
        Link to profile
      </button>
      {currentLinkedEmail ? <p className="text-xs text-zinc-400">Current: {currentLinkedEmail}</p> : null}
      {open ? (
        <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search email"
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100"
            />
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={loading || query.trim().length < 3}
              className="rounded-md bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-900 disabled:opacity-50"
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
          <ul className="mt-2 space-y-2">
            {results.map((profile) => (
              <li key={profile.id} className="rounded border border-zinc-800 px-2 py-2 text-xs text-zinc-300">
                <p className="font-medium text-zinc-100">{profile.email ?? "No email"}</p>
                <p>{profile.full_name ?? "No name"} · role={profile.role}</p>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void linkProfile(profile.id)}
                  className="mt-2 rounded bg-emerald-500 px-2 py-1 font-medium text-emerald-950 disabled:opacity-50"
                >
                  {saving ? "Saving..." : `Confirm link ${entityLabel}`}
                </button>
              </li>
            ))}
            {!loading && results.length === 0 ? (
              <li className="text-xs text-zinc-500">No profiles found yet.</li>
            ) : null}
          </ul>
          <p className="mt-2 text-[11px] text-zinc-500">Entity id: {entityId.slice(0, 8)}…</p>
        </div>
      ) : null}
    </div>
  );
}

