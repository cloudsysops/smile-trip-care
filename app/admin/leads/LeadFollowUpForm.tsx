"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { patchLeadById } from "./leadFormApi";

type Props = Readonly<{
  leadId: string;
  currentStatus: string;
  currentLastContactedAt?: string | null;
  currentNextFollowUpAt?: string | null;
  currentFollowUpNotes?: string | null;
}>;

function toInputValue(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromInputValue(value: string): string | null {
  if (!value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export default function LeadFollowUpForm({
  leadId,
  currentStatus,
  currentLastContactedAt,
  currentNextFollowUpAt,
  currentFollowUpNotes,
}: Props) {
  const router = useRouter();
  const [lastContactedAt, setLastContactedAt] = useState(toInputValue(currentLastContactedAt));
  const [nextFollowUpAt, setNextFollowUpAt] = useState(toInputValue(currentNextFollowUpAt));
  const [followUpNotes, setFollowUpNotes] = useState(currentFollowUpNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasFollowUpScheduled = useMemo(() => nextFollowUpAt.trim().length > 0, [nextFollowUpAt]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await patchLeadById(leadId, {
        last_contacted_at: fromInputValue(lastContactedAt) ?? null,
        next_follow_up_at: fromInputValue(nextFollowUpAt),
        follow_up_notes: followUpNotes.trim() ? followUpNotes.trim() : null,
      });
      setSuccess("Follow-up saved.");
      // Allow the user to see the success message before the server re-renders.
      setTimeout(() => router.refresh(), 750);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save follow-up");
    } finally {
      setSaving(false);
    }
  }

  async function markContactedAndSchedule() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const payload: Record<string, unknown> = {
        last_contacted_at: now.toISOString(),
        next_follow_up_at: tomorrow.toISOString(),
      };
      if (currentStatus === "new") {
        payload.status = "contacted";
      }
      await patchLeadById(leadId, payload);
      setSuccess("Contacted and follow-up scheduled.");
      // Allow the user to see the success message before the server re-renders.
      setTimeout(() => router.refresh(), 750);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">Follow-up planner</h2>
        <button
          type="button"
          onClick={markContactedAndSchedule}
          disabled={saving}
          className="rounded border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800/40 disabled:opacity-50"
        >
          Mark contacted + follow up in 24h
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="last_contacted_at" className="block text-sm font-medium text-zinc-300">
            Last contacted at
          </label>
          <input
            id="last_contacted_at"
            type="datetime-local"
            value={lastContactedAt}
            onChange={(e) => setLastContactedAt(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="next_follow_up_at" className="block text-sm font-medium text-zinc-300">
            Next follow-up at
          </label>
          <input
            id="next_follow_up_at"
            type="datetime-local"
            value={nextFollowUpAt}
            onChange={(e) => setNextFollowUpAt(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
          />
          <p className="mt-1 text-xs text-zinc-400">
            {hasFollowUpScheduled ? "Follow-up scheduled." : "No follow-up scheduled yet."}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="follow_up_notes" className="block text-sm font-medium text-zinc-300">
          Follow-up notes
        </label>
        <textarea
          id="follow_up_notes"
          rows={3}
          maxLength={2000}
          value={followUpNotes}
          onChange={(e) => setFollowUpNotes(e.target.value)}
          placeholder="Objections, preferred channel, next action..."
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500"
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success && (
        <p role="status" className="mt-2 text-xs text-emerald-400">
          {success}
        </p>
      )}
      {saving && <p className="mt-2 text-xs text-zinc-400">Loading...</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save follow-up"}
      </button>
    </form>
  );
}
