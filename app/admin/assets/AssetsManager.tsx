"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

type Asset = {
  id: string;
  slug: string;
  kind: string;
  title: string | null;
  category: string | null;
  location: string | null;
  tags: string[] | null;
  approved: boolean;
  published: boolean;
  created_at: string;
  signed_url?: string | null;
};

const CATEGORIES = ["clinic", "finca", "lodging", "tour", "team", "other"];
const LOCATIONS = ["Medellín", "Manizales", "Other"];

export default function AssetsManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [approved, setApproved] = useState("");
  const [published, setPublished] = useState("");
  const [search, setSearch] = useState("");

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (location) params.set("location", location);
    if (approved) params.set("approved", approved);
    if (published) params.set("published", published);
    if (search.trim()) params.set("search", search.trim());
    return params;
  }, [category, location, approved, published, search]);

  const fetchAssets = useCallback(() => {
    setLoading(true);
    const params = buildParams();
    fetch(`/api/admin/assets?${params}`)
      .then((r) => r.json())
      .then((j) => {
        setAssets(j.data ?? []);
        setTotal(j.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [buildParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchAssets();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAssets]);

  async function toggleApproved(id: string, value: boolean) {
    const res = await fetch(`/api/admin/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: value }),
    });
    if (res.ok) fetchAssets();
  }

  async function togglePublished(id: string, value: boolean) {
    const res = await fetch(`/api/admin/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: value }),
    });
    if (res.ok) fetchAssets();
  }

  async function deleteAsset(id: string) {
    if (!confirm("Delete this asset?")) return;
    const res = await fetch(`/api/admin/assets/${id}`, { method: "DELETE" });
    if (res.ok) fetchAssets();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search title/alt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchAssets()}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border border-zinc-300 px-3 py-1.5 text-sm">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={location} onChange={(e) => setLocation(e.target.value)} className="rounded border border-zinc-300 px-3 py-1.5 text-sm">
          <option value="">All locations</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <select value={approved} onChange={(e) => setApproved(e.target.value)} className="rounded border border-zinc-300 px-3 py-1.5 text-sm">
          <option value="">Approved: any</option>
          <option value="true">Approved</option>
          <option value="false">Not approved</option>
        </select>
        <select value={published} onChange={(e) => setPublished(e.target.value)} className="rounded border border-zinc-300 px-3 py-1.5 text-sm">
          <option value="">Published: any</option>
          <option value="true">Published</option>
          <option value="false">Not published</option>
        </select>
        <button type="button" onClick={fetchAssets} className="rounded bg-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-300">Apply</button>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-3 py-2 font-medium">Thumb</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Location</th>
                <th className="px-3 py-2 font-medium">Tags</th>
                <th className="px-3 py-2 font-medium">Approved</th>
                <th className="px-3 py-2 font-medium">Published</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="border-b border-zinc-100">
                  <td className="px-3 py-2">
                    {a.signed_url ? (
                      <div className="relative h-12 w-16 overflow-hidden rounded bg-zinc-100">
                        <Image src={a.signed_url} alt={a.title ?? a.slug} fill className="object-cover" sizes="64px" unoptimized />
                      </div>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium">{a.title ?? "—"}</td>
                  <td className="px-3 py-2">{a.category ?? "—"}</td>
                  <td className="px-3 py-2">{a.location ?? "—"}</td>
                  <td className="px-3 py-2">{Array.isArray(a.tags) ? a.tags.join(", ") : "—"}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleApproved(a.id, !a.approved)}
                      className={`rounded px-2 py-0.5 text-xs ${a.approved ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}
                    >
                      {a.approved ? "Yes" : "No"}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => togglePublished(a.id, !a.published)}
                      className={`rounded px-2 py-0.5 text-xs ${a.published ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}
                    >
                      {a.published ? "Yes" : "No"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-zinc-500">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => deleteAsset(a.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {assets.length === 0 && <p className="p-6 text-center text-zinc-500">No assets. Upload one to get started.</p>}
          {total > 0 && <p className="border-t border-zinc-100 px-3 py-2 text-xs text-zinc-500">Total: {total}</p>}
        </div>
      )}
    </div>
  );
}
