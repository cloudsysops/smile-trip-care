"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES = ["clinic", "finca", "lodging", "tour", "team", "other"];
const LOCATIONS = ["Medellín", "Manizales", "Other"];

export default function NewAssetPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"clinic" | "finca" | "lodging" | "tour" | "team" | "other">("clinic");
  const [location, setLocation] = useState<"Medellín" | "Manizales" | "Other">("Medellín");
  const [tags, setTags] = useState("");
  const [alt_text, setAltText] = useState("");
  const [source_url, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Please select an image.");
      return;
    }
    if (!alt_text.trim()) {
      setError("Alt text is required.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("title", title.trim() || file.name);
    formData.set("category", category);
    formData.set("location", location);
    formData.set("tags", tags.trim());
    formData.set("alt_text", alt_text.trim());
    if (source_url.trim()) formData.set("source_url", source_url.trim());
    try {
      const res = await fetch("/api/admin/assets/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setFile(null);
      setTitle("");
      setTags("");
      setAltText("");
      setSourceUrl("");
    } catch {
      setError("Network error.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/admin/assets" className="text-sm text-zinc-600 hover:underline">← Assets</Link>
          <h1 className="text-xl font-semibold">Upload asset</h1>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-8">
        {success && (
          <div className="mb-6 rounded-lg bg-emerald-50 p-4 text-emerald-800">
            Asset uploaded. It will not appear on the site until approved and published.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-zinc-700">Image *</label>
            <input
              id="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm"
            />
            <p className="mt-1 text-xs text-zinc-500">JPEG, PNG, or WebP. Max 8MB.</p>
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-zinc-700">Title</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-zinc-700">Category *</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-zinc-700">Location *</label>
            <select id="location" value={location} onChange={(e) => setLocation(e.target.value as typeof location)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2">
              {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-zinc-700">Tags (comma-separated)</label>
            <input id="tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="clinic, medellin" className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="alt_text" className="block text-sm font-medium text-zinc-700">Alt text *</label>
            <input id="alt_text" type="text" value={alt_text} onChange={(e) => setAltText(e.target.value)} maxLength={500} required className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" placeholder="Describe the image for accessibility" />
          </div>
          <div>
            <label htmlFor="source_url" className="block text-sm font-medium text-zinc-700">Source URL (optional)</label>
            <input id="source_url" type="url" value={source_url} onChange={(e) => setSourceUrl(e.target.value)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {loading ? "Uploading…" : "Upload"}
            </button>
            <Link href="/admin/assets" className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancel</Link>
          </div>
        </form>
      </main>
    </div>
  );
}
