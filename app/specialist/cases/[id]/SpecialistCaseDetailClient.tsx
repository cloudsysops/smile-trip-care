"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [stageKey, setStageKey] = useState<string>(TREATMENT_STAGES[0]?.key ?? "");
  const [notes, setNotes] = useState("");

  async function loadCase() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/specialist/cases/${caseId}`);
      const json = (await res.json().catch(() => ({}))) as Partial<CasePayload> & { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not load case");
        setData(null);
        return;
      }
      setData(json as CasePayload);
    } catch {
      setError("Could not load case");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCase();
  }, [caseId]);

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
      await loadCase();
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
        <p className="mt-2 text-sm text-zinc-300">
          Notes: {data.lead.notes?.trim() ? data.lead.notes : "No patient notes."}
        </p>
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

