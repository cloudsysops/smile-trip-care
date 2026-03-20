"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TreatmentProgressTimeline, { type ProgressItem } from "@/app/components/dashboard/TreatmentProgressTimeline";
import { TREATMENT_STAGES } from "@/lib/clinical/stages";

type CasePayload = {
  ok: boolean;
  case: {
    id: string;
    lead_id: string;
    status: string;
    requested_at: string | null;
    scheduled_at: string | null;
    case_priority?: string;
    specialist_coordinator_request?: string | null;
    notes: string | null;
  };
  lead: {
    id: string;
    patient_name: string;
    status: string;
    notes: string | null;
    package_slug: string | null;
    treatment_interest: string[];
  };
  progress: ProgressItem[];
  recommendations: string[];
};

type Props = Readonly<{ caseId: string }>;

export default function SpecialistCaseDetailClient({ caseId }: Props) {
  const [data, setData] = useState<CasePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [stageKey, setStageKey] = useState<string>(TREATMENT_STAGES[0]?.key ?? "");
  const [notes, setNotes] = useState("");
  const [scheduleLocal, setScheduleLocal] = useState("");
  const [coordinatorMessage, setCoordinatorMessage] = useState("");

  const loadCase = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/specialist/cases/${caseId}`);
      const json = (await res.json().catch(() => ({}))) as Partial<CasePayload> & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not load case");
        setData(null);
        return;
      }
      const payload = json as CasePayload;
      setData(payload);
      if (payload.case?.scheduled_at) {
        const d = new Date(payload.case.scheduled_at);
        if (!Number.isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, "0");
          setScheduleLocal(
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
          );
        }
      } else {
        setScheduleLocal("");
      }
    } catch {
      setError("Could not load case");
      setData(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void loadCase();
  }, [loadCase]);

  async function patchCase(body: Record<string, unknown>): Promise<boolean> {
    setActionBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/specialist/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(payload.error ?? "Action failed");
        return false;
      }
      await loadCase({ silent: true });
      return true;
    } catch {
      setError("Action failed");
      return false;
    } finally {
      setActionBusy(false);
    }
  }

  const treatmentInterestText = useMemo(() => {
    if (!data?.lead.treatment_interest?.length) {
      return data?.lead.package_slug ?? "General assessment";
    }
    return data.lead.treatment_interest.join(", ");
  }, [data]);

  async function handleAddProgress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data?.case?.lead_id || !stageKey) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/clinical/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: data.case.lead_id,
          stage_key: stageKey,
          notes: notes.trim() || undefined,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(payload.error ?? "Failed to add progress note");
        return;
      }
      setNotes("");
      await loadCase({ silent: true });
    } catch {
      setError("Failed to add progress note");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-400">Loading case...</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-red-300">{error ?? "Case not available."}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-base font-semibold text-zinc-100">Patient</h2>
        <p className="mt-1 text-sm text-zinc-300">{data.lead.patient_name}</p>
        <p className="mt-1 text-sm text-zinc-400">Treatment interest: {treatmentInterestText}</p>
        <p className="mt-1 text-sm text-zinc-400">Lead status: {data.lead.status}</p>
        <p className="mt-1 text-sm text-zinc-400">Consultation status: {data.case.status}</p>
        <p className="mt-1 text-sm text-zinc-400">Case priority: {data.case.case_priority ?? "normal"}</p>
        {data.case.specialist_coordinator_request?.trim() ? (
          <p className="mt-2 rounded-md border border-amber-900/50 bg-amber-950/30 p-2 text-sm text-amber-100">
            Coordinator request: {data.case.specialist_coordinator_request}
          </p>
        ) : null}
        <p className="mt-2 text-sm text-zinc-300">
          Notes: {data.lead.notes?.trim() ? data.lead.notes : "No patient notes."}
        </p>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-base font-semibold text-zinc-100">Case actions</h2>
        <p className="mt-1 text-xs text-zinc-500">Accept or decline new requests, schedule, complete treatment, or message the coordinator.</p>
        <div className="mt-4 flex flex-col gap-4">
          {(data.case.status === "requested" || data.case.status === "accepted") && (
            <div className="flex flex-wrap gap-2">
              {data.case.status === "requested" ? (
                <>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void patchCase({ action: "accept" })}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    Accept case
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => void patchCase({ action: "decline" })}
                    className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => void patchCase({ action: "decline" })}
                  className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
                >
                  Decline before scheduling
                </button>
              )}
            </div>
          )}

          {(data.case.status === "requested" || data.case.status === "accepted") && (
            <div className="space-y-2">
              <label htmlFor="schedule-at" className="block text-xs font-medium uppercase tracking-wide text-zinc-400">
                Schedule appointment
              </label>
              <div className="flex flex-wrap items-end gap-2">
                <input
                  id="schedule-at"
                  type="datetime-local"
                  value={scheduleLocal}
                  onChange={(e) => setScheduleLocal(e.target.value)}
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                />
                <button
                  type="button"
                  disabled={actionBusy || !scheduleLocal}
                  onClick={() => {
                    const iso = new Date(scheduleLocal).toISOString();
                    if (Number.isNaN(Date.parse(iso))) {
                      setError("Pick a valid date and time");
                      return;
                    }
                    void patchCase({ action: "schedule", scheduled_at: iso });
                  }}
                  className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                >
                  Save appointment
                </button>
              </div>
            </div>
          )}

          {data.case.status === "scheduled" && (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void patchCase({ action: "complete" })}
              className="w-fit rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              Mark treatment complete
            </button>
          )}

          <div className="space-y-2 border-t border-zinc-800 pt-4">
            <label htmlFor="coord-msg" className="block text-xs font-medium uppercase tracking-wide text-zinc-400">
              Request info from coordinator
            </label>
            <textarea
              id="coord-msg"
              rows={3}
              value={coordinatorMessage}
              onChange={(e) => setCoordinatorMessage(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              placeholder="What do you need from the coordinator?"
            />
            <button
              type="button"
              disabled={actionBusy || !coordinatorMessage.trim()}
              onClick={() => {
                void (async () => {
                  const ok = await patchCase({ action: "request_info", message: coordinatorMessage.trim() });
                  if (ok) setCoordinatorMessage("");
                })();
              }}
              className="rounded-full border border-amber-600/60 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-950/40 disabled:opacity-50"
            >
              Send request
            </button>
          </div>
        </div>
      </section>

      <TreatmentProgressTimeline items={data.progress} emptyMessage="No clinical progress yet." />

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-base font-semibold text-zinc-100">Next steps / recommendations</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          {data.recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <form onSubmit={handleAddProgress} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="text-base font-semibold text-zinc-100">Add progress note</h2>
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="stage" className="block text-xs font-medium uppercase tracking-wide text-zinc-400">
              Stage
            </label>
            <select
              id="stage"
              value={stageKey}
              onChange={(e) => setStageKey(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              {TREATMENT_STAGES.map((stage) => (
                <option key={stage.key} value={stage.key}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="note" className="block text-xs font-medium uppercase tracking-wide text-zinc-400">
              Note
            </label>
            <textarea
              id="note"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              placeholder="Add a short progress note..."
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save progress note"}
          </button>
        </div>
      </form>
    </div>
  );
}

