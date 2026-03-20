"use client";

import { useMemo, useState } from "react";

export type SlotState = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DEFAULT_START = "09:00";
const DEFAULT_END = "17:00";

function buildInitialSlots(initial: SlotState[]): SlotState[] {
  const byDay = new Map(initial.map((s) => [s.day_of_week, s]));
  const out: SlotState[] = [];
  for (let d = 0; d <= 6; d++) {
    const existing = byDay.get(d);
    out.push(
      existing ?? {
        day_of_week: d,
        start_time: DEFAULT_START,
        end_time: DEFAULT_END,
        is_available: false,
      },
    );
  }
  return out;
}

export function SpecialistAvailabilityClient({ initialSlots }: { initialSlots: SlotState[] }) {
  const [slots, setSlots] = useState(() => buildInitialSlots(initialSlots));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orderedForDisplay = useMemo(() => {
    // Mon–Sun in UI: Mon=1 … Sun=0 → order 1,2,3,4,5,6,0
    const order = [1, 2, 3, 4, 5, 6, 0];
    return order.map((d) => slots.find((s) => s.day_of_week === d)!).filter(Boolean);
  }, [slots]);

  function updateDay(day: number, patch: Partial<SlotState>) {
    setSlots((prev) => prev.map((s) => (s.day_of_week === day ? { ...s, ...patch } : s)));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = { slots: slots.filter((s) => s.is_available) };
      const res = await fetch("/api/specialist/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to save");
        return;
      }
      if (Array.isArray(data.slots)) {
        setSlots(buildInitialSlots(data.slots as SlotState[]));
      }
      setMessage("Saved.");
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Set your weekly recurring availability. Days turned off are saved as unavailable (no slot stored).
      </p>
      <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950/50">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-left">
              <th className="px-4 py-2 font-medium text-zinc-300">Day</th>
              <th className="px-4 py-2 font-medium text-zinc-300">Available</th>
              <th className="px-4 py-2 font-medium text-zinc-300">Start</th>
              <th className="px-4 py-2 font-medium text-zinc-300">End</th>
            </tr>
          </thead>
          <tbody>
            {orderedForDisplay.map((row) => (
              <tr key={row.day_of_week} className="border-b border-zinc-800">
                <td className="px-4 py-2 font-medium text-zinc-100">{DAY_LABELS[row.day_of_week]}</td>
                <td className="px-4 py-2">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={row.is_available}
                      onChange={(e) => updateDay(row.day_of_week, { is_available: e.target.checked })}
                      className="rounded border-zinc-600"
                    />
                    <span className="text-zinc-400">{row.is_available ? "On" : "Off"}</span>
                  </label>
                </td>
                <td className="px-4 py-2">
                  <input
                    type="time"
                    value={row.start_time}
                    disabled={!row.is_available}
                    onChange={(e) => updateDay(row.day_of_week, { start_time: e.target.value })}
                    className="rounded border border-zinc-600 bg-zinc-950 px-2 py-1 text-zinc-100 disabled:opacity-50"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="time"
                    value={row.end_time}
                    disabled={!row.is_available}
                    onChange={(e) => updateDay(row.day_of_week, { end_time: e.target.value })}
                    className="rounded border border-zinc-600 bg-zinc-950 px-2 py-1 text-zinc-100 disabled:opacity-50"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save schedule"}
        </button>
        {message ? <span className="text-sm text-emerald-400">{message}</span> : null}
        {error ? <span className="text-sm text-red-400">{error}</span> : null}
      </div>
    </div>
  );
}
