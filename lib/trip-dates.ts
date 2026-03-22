/** Pure date helpers for trip builder (client + server safe). */

export function addDaysToIsoDate(anchorYmd: string, days: number): string {
  const parts = anchorYmd.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function tripDayFromScheduled(scheduled: string | null | undefined, anchorYmd: string): number | null {
  if (!scheduled || !anchorYmd) return null;
  const a = new Date(`${anchorYmd}T12:00:00.000Z`).getTime();
  const s = new Date(`${scheduled.slice(0, 10)}T12:00:00.000Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(s)) return null;
  return Math.round((s - a) / 86400000);
}

export function serviceCategoryToItemType(
  category: string,
): "lodging" | "transport" | "experience" | "therapy" | "custom" {
  if (category === "lodging") return "lodging";
  if (category === "transport") return "transport";
  if (category === "experience") return "experience";
  if (category === "therapy") return "therapy";
  return "custom";
}
