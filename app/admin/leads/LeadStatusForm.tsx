"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { patchLeadById } from "./leadFormApi";

const STATUSES = ["new", "contacted", "qualified", "deposit_paid", "completed", "cancelled"] as const;

type Props = Readonly<{ leadId: string; currentStatus: string }>;

export default function LeadStatusForm({ leadId, currentStatus }: Props) {
  const router = useRouter();
  const statusOptions = [...STATUSES];
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await patchLeadById(leadId, { status }, "Failed to update status");
      setSuccess("Status updated.");
      // Allow the user to see the success message before the server re-renders.
      setTimeout(() => router.refresh(), 750);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="font-semibold">Update status</h2>
      {statusOptions.length === 0 && (
        <p className="mt-2 text-xs text-zinc-400">No statuses yet.</p>
      )}
      <div className="mt-3 flex gap-2">
        <select
          aria-label="Lead status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={statusOptions.length === 0}
          className="rounded border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {success && (
        <p role="status" className="mt-2 text-xs text-emerald-400">
          {success}
        </p>
      )}
      {saving && <p className="mt-2 text-xs text-zinc-400">Loading...</p>}
    </form>
  );
}
