"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type SpecialistOption = { id: string; name: string; specialty: string; city: string };

export type LeadConsultationListItem = {
  id: string;
  specialist_id: string;
  status: string;
  scheduled_at: string | null;
  requested_at: string | null;
  case_priority: string | null;
  notes: string | null;
  specialist_name: string | null;
};

type Props = Readonly<{
  leadId: string;
  initialConsultations: LeadConsultationListItem[];
}>;

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

export default function LeadConsultationsSection({ leadId, initialConsultations }: Props) {
  const router = useRouter();
  const [consultations, setConsultations] = useState(initialConsultations);
  const [specialists, setSpecialists] = useState<SpecialistOption[]>([]);
  const [loadingSpecs, setLoadingSpecs] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [specialistId, setSpecialistId] = useState("");
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [notes, setNotes] = useState("");
  const [casePriority, setCasePriority] = useState<"low" | "normal" | "high" | "urgent">("normal");

  useEffect(() => {
    setConsultations(initialConsultations);
  }, [initialConsultations]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/specialists");
        const data = (await res.json().catch(() => null)) as unknown;
        if (!res.ok || !Array.isArray(data)) {
          if (!cancelled) setSpecialists([]);
          return;
        }
        if (!cancelled) {
          setSpecialists(
            data.map((s: { id: string; name: string; specialty?: string; city?: string }) => ({
              id: s.id,
              name: s.name,
              specialty: typeof s.specialty === "string" ? s.specialty : "",
              city: typeof s.city === "string" ? s.city : "",
            })),
          );
        }
      } catch {
        if (!cancelled) setSpecialists([]);
      } finally {
        if (!cancelled) setLoadingSpecs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!specialistId) {
      setError("Select a specialist.");
      return;
    }
    setSubmitting(true);
    try {
      const hasSchedule = scheduledLocal.trim() !== "";
      if (hasSchedule && Number.isNaN(new Date(scheduledLocal).getTime())) {
        setError("Invalid date/time.");
        setSubmitting(false);
        return;
      }
      const scheduled_at = hasSchedule ? new Date(scheduledLocal).toISOString() : undefined;
      const body: Record<string, unknown> = {
        lead_id: leadId,
        specialist_id: specialistId,
        status: hasSchedule ? "scheduled" : "requested",
        notes: notes.trim() || undefined,
        case_priority: casePriority,
      };
      if (hasSchedule && scheduled_at) {
        body.scheduled_at = scheduled_at;
      }
      const res = await fetch("/api/admin/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        id?: string;
        specialist_id?: string;
        status?: string;
        scheduled_at?: string | null;
        requested_at?: string | null;
        case_priority?: string;
        notes?: string | null;
      };
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Failed to create consultation");
        return;
      }
      const createdId = json.id;
      const createdSpecId = json.specialist_id;
      if (!createdId || !createdSpecId) {
        setError("Unexpected response from server.");
        return;
      }
      const specName = specialists.find((s) => s.id === createdSpecId)?.name ?? null;
      const isoScheduled = hasSchedule && scheduled_at ? scheduled_at : null;
      const newRow: LeadConsultationListItem = {
        id: createdId,
        specialist_id: createdSpecId,
        status: json.status ?? (hasSchedule ? "scheduled" : "requested"),
        scheduled_at: json.scheduled_at ?? isoScheduled,
        requested_at: json.requested_at ?? null,
        case_priority: json.case_priority ?? casePriority,
        notes: json.notes ?? (notes.trim() || null),
        specialist_name: specName,
      };
      setConsultations((prev) => [newRow, ...prev]);
      setShowForm(false);
      setSpecialistId("");
      setScheduledLocal("");
      setNotes("");
      setCasePriority("normal");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-100">Consultations</h2>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setError(null);
          }}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {showForm ? "Cancel" : "Create consultation"}
        </button>
      </div>
      <p className="mt-1 text-xs text-zinc-400">
        Assign a specialist; optional date/time sets status to scheduled. Appears on the specialist dashboard immediately.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-md border border-zinc-800 bg-zinc-950/50 p-4">
          <div>
            <label htmlFor="consult-specialist" className="block text-xs font-medium uppercase tracking-wide text-zinc-400">
              Specialist
            </label>
            <select
              id="consult-specialist"
              required
              value={specialistId}
              onChange={(e) => setSpecialistId(e.target.value)}
              disabled={loadingSpecs || specialists.length === 0}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">{loadingSpecs ? "Loading specialists…" : "Select specialist"}</option>
              {specialists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.specialty ? ` · ${s.specialty}` : ""}
                  {s.city ? ` (${s.city})` : ""}
                </option>
              ))}
            </select>
            {!loadingSpecs && specialists.length === 0 ? (
              <p className="mt-1 text-xs text-amber-400">No specialists in directory. Add specialists in admin first.</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="consult-scheduled" className="block text-xs font-medium uppercase tracking-wide text-zinc-400">
              Scheduled date &amp; time (optional)
            </label>
            <input
              id="consult-scheduled"
              type="datetime-local"
              value={scheduledLocal}
              onChange={(e) => setScheduledLocal(e.target.value)}
              className="mt-1 w-full max-w-xs rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
            <p className="mt-1 text-xs text-zinc-500">Leave empty to create as &quot;requested&quot; only.</p>
          </div>
          <div>
            <label htmlFor="consult-priority" className="block text-xs font-medium uppercase tracking-wide text-zinc-400">
              Case priority
            </label>
            <select
              id="consult-priority"
              value={casePriority}
              onChange={(e) => setCasePriority(e.target.value as typeof casePriority)}
              className="mt-1 w-full max-w-xs rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label htmlFor="consult-notes" className="block text-xs font-medium uppercase tracking-wide text-zinc-400">
              Notes
            </label>
            <textarea
              id="consult-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={2000}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              placeholder="Internal notes for the specialist…"
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting || !specialistId || specialists.length === 0}
            className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Save consultation"}
          </button>
        </form>
      )}

      <div className="mt-4">
        {consultations.length === 0 ? (
          <p className="text-sm text-zinc-400">No consultations yet for this lead.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {consultations.map((c) => (
              <li key={c.id} className="rounded border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                <p className="font-medium text-zinc-200">
                  {c.specialist_name ?? `Specialist ${c.specialist_id.slice(0, 8)}…`}
                </p>
                <p className="mt-1 text-zinc-300">
                  <span className="text-zinc-500">Status:</span> {c.status}
                  {" · "}
                  <span className="text-zinc-500">Priority:</span> {c.case_priority ?? "normal"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Requested: {formatWhen(c.requested_at)} · Scheduled: {formatWhen(c.scheduled_at)}
                </p>
                {c.notes?.trim() ? (
                  <p className="mt-2 whitespace-pre-wrap text-xs text-zinc-400">{c.notes.trim()}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
