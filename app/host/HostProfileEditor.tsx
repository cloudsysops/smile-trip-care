"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = Readonly<{
  initial: {
    display_name: string;
    city: string | null;
    bio: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
}>;

export default function HostProfileEditor({ initial }: Props) {
  const router = useRouter();
  const [display_name, setDisplayName] = useState(initial.display_name);
  const [city, setCity] = useState(initial.city ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/host/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name,
          city: city.trim() || null,
          bio: bio.trim() || null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }
      setMessage("Profile saved.");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div>
        <label className="block text-xs font-medium text-zinc-400" htmlFor="host-display-name">
          Display name
        </label>
        <input
          id="host-display-name"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
          value={display_name}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          maxLength={200}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400" htmlFor="host-city">
          City
        </label>
        <input
          id="host-city"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          maxLength={100}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400" htmlFor="host-bio">
          Bio
        </label>
        <textarea
          id="host-bio"
          rows={4}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={5000}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-zinc-400" htmlFor="host-phone">
            Phone
          </label>
          <input
            id="host-phone"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={50}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400" htmlFor="host-whatsapp">
            WhatsApp
          </label>
          <input
            id="host-whatsapp"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            maxLength={50}
          />
        </div>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
