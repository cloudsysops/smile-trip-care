"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  leadId: string;
  currentStatus: string;
  currentLastContactedAt?: string | null;
  currentNextFollowUpAt?: string | null;
  currentFollowUpNotes?: string | null;
};

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

  const hasFollowUpScheduled = useMemo(() => nextFollowUpAt.trim().length > 0, [nextFollowUpAt]);

  async function patchLead(payload: Record<string, unknown>) {
    const response = await fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((data.error as string) || "Update failed");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await patchLead({
        last_contacted_at: fromInputValue(lastContactedAt) ?? null,
        next_follow_up_at: fromInputValue(nextFollowUpAt),
        follow_up_notes: followUpNotes.trim() ? followUpNotes.trim() : null,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save follow-up");
    } finally {
      setSaving(false);
    }
  }

  async function markContactedAndSchedule() {
    setSaving(true);
    setError(null);
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
      await patchLead(payload);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="rounded-lg border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">Follow-up planner</h2>
        <button
          type="button"
          onClick={markContactedAndSchedule}
          disabled={saving}
          className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Mark contacted + follow up in 24h
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="last_contacted_at" className="block text-sm font-medium text-zinc-600">
            Last contacted at
          </label>
          <input
            id="last_contacted_at"
            type="datetime-local"
            value={lastContactedAt}
            onChange={(e) => setLastContactedAt(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="next_follow_up_at" className="block text-sm font-medium text-zinc-600">
            Next follow-up at
          </label>
          <input
            id="next_follow_up_at"
            type="datetime-local"
            value={nextFollowUpAt}
            onChange={(e) => setNextFollowUpAt(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-zinc-500">
            {hasFollowUpScheduled ? "Follow-up scheduled." : "No follow-up scheduled yet."}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="follow_up_notes" className="block text-sm font-medium text-zinc-600">
          Follow-up notes
        </label>
        <textarea
          id="follow_up_notes"
          rows={3}
          maxLength={2000}
          value={followUpNotes}
          onChange={(e) => setFollowUpNotes(e.target.value)}
          placeholder="Objections, preferred channel, next action..."
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

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
