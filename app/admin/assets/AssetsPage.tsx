"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type AssetRow = {
  id: string;
  title: string | null;
  category: string | null;
  location: string | null;
  tags: string[] | null;
  approved: boolean;
  published: boolean;
  storage_path?: string | null;
  alt_text: string | null;
  created_at: string;
  signed_url?: string | null;
};

type FilterState = {
  category: string;
  location: string;
  approved: string;
  published: string;
  q: string;
};

const CATEGORY_OPTIONS = ["all", "clinic", "finca", "lodging", "tour", "team", "other"];
const LOCATION_OPTIONS = ["all", "Medellín", "Manizales", "Other"];

export default function AssetsPage() {
  const [items, setItems] = useState<AssetRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    location: "all",
    approved: "all",
    published: "all",
    q: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [editTags, setEditTags] = useState("");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.location !== "all") params.set("location", filters.location);
    if (filters.approved !== "all") params.set("approved", filters.approved);
    if (filters.published !== "all") params.set("published", filters.published);
    if (filters.q.trim()) params.set("q", filters.q.trim());
    try {
      const res = await fetch(`/api/admin/assets?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load assets.");
      } else {
        setItems(data.items ?? []);
        setTotal(data.count ?? 0);
      }
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }, [filters.approved, filters.category, filters.location, filters.published, filters.q, page, pageSize]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchAssets();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchAssets]);

  async function patchAsset(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/admin/assets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error ?? "Update failed");
    }
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, ...data } : row)));
  }

  async function handleToggle(id: string, field: "approved" | "published", value: boolean) {
    try {
      await patchAsset(id, { [field]: value });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this asset? This will remove the file from storage.")) return;
    const res = await fetch(`/api/admin/assets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((row) => row.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    }
  }

  function startEdit(asset: AssetRow) {
    setEditingId(asset.id);
    setEditTitle(asset.title ?? "");
    setEditAlt(asset.alt_text ?? "");
    setEditTags((asset.tags ?? []).join(", "));
  }

  async function saveEdit(id: string) {
    const tags = editTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 16);
    try {
      await patchAsset(id, {
        title: editTitle.trim() || null,
        alt_text: editAlt.trim() || null,
        tags,
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  }

  const totalPages = useMemo(
    () => (total > 0 ? Math.ceil(total / pageSize) : 1),
    [total, pageSize],
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-semibold">Admin — Assets</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/assets/new"
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Upload asset
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-zinc-600">Category</label>
            <select
              value={filters.category}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, category: e.target.value }));
              }}
              className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Location</label>
            <select
              value={filters.location}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, location: e.target.value }));
              }}
              className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
            >
              {LOCATION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Approved</label>
            <select
              value={filters.approved}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, approved: e.target.value }));
              }}
              className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
            >
              <option value="all">all</option>
              <option value="true">approved</option>
              <option value="false">not approved</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">Published</label>
            <select
              value={filters.published}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, published: e.target.value }));
              }}
              className="mt-1 rounded border border-zinc-300 px-2 py-1 text-sm"
            >
              <option value="all">all</option>
              <option value="true">published</option>
              <option value="false">unpublished</option>
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-zinc-600">Search</label>
            <input
              type="text"
              value={filters.q}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, q: e.target.value }));
              }}
              placeholder="Title or tag…"
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm"
            />
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-zinc-500">Loading…</p>}

        <section className="rounded-lg border border-zinc-200 bg-white overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-3 py-2">Preview</th>
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Location</th>
                <th className="px-3 py-2">Tags</th>
                <th className="px-3 py-2">Approved</th>
                <th className="px-3 py-2">Published</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((asset) => {
                const isEditing = editingId === asset.id;
                return (
                  <tr key={asset.id} className="border-b border-zinc-100">
                    <td className="px-3 py-2">
                      {asset.signed_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.signed_url}
                          alt={asset.alt_text ?? asset.title ?? "asset"}
                          className="h-12 w-16 rounded object-cover"
                        />
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      {isEditing ? (
                        <input
                          className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      ) : (
                        <div className="text-xs font-medium">{asset.title}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">{asset.category}</td>
                    <td className="px-3 py-2 align-top">{asset.location}</td>
                    <td className="px-3 py-2 align-top">
                      {isEditing ? (
                        <input
                          className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                        />
                      ) : (
                        <span>{(asset.tags ?? []).join(", ")}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="checkbox"
                        checked={asset.approved}
                        onChange={(e) => handleToggle(asset.id, "approved", e.target.checked)}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="checkbox"
                        checked={asset.published}
                        onChange={(e) => handleToggle(asset.id, "published", e.target.checked)}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 align-top space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(asset.id)}
                            className="text-emerald-600 hover:underline"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="text-zinc-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(asset)}
                          className="text-emerald-600 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(asset.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length === 0 && !loading && (
            <p className="p-4 text-sm text-zinc-500">No assets yet.</p>
          )}
        </section>

        <section className="flex items-center justify-between text-xs text-zinc-600">
          <span>
            Page {page} of {totalPages} ({total} assets)
          </span>
          <div className="space-x-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-zinc-300 px-2 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

