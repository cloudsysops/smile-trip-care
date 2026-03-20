import { getServerSupabase } from "@/lib/supabase/server";

export type AvailabilitySlotRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

function normalizeTime(t: string): string {
  const s = t.trim();
  if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  return s;
}

/** Load availability rows for a specialist (0–6 days). */
export async function getAvailabilitySlotsForSpecialist(specialistId: string): Promise<AvailabilitySlotRow[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("specialist_availability")
    .select("day_of_week, start_time, end_time, is_available")
    .eq("specialist_id", specialistId)
    .order("day_of_week");
  if (error || !data) return [];
  return (data as { day_of_week: number; start_time: string; end_time: string; is_available: boolean }[]).map(
    (r) => ({
      day_of_week: r.day_of_week,
      start_time: String(r.start_time).slice(0, 5),
      end_time: String(r.end_time).slice(0, 5),
      is_available: r.is_available,
    }),
  );
}

/** Replace all weekly slots for a specialist (transactional delete + insert). */
export async function replaceAvailabilityForSpecialist(
  specialistId: string,
  slots: AvailabilitySlotRow[],
): Promise<{ error: string | null }> {
  const supabase = getServerSupabase();
  const { error: delErr } = await supabase.from("specialist_availability").delete().eq("specialist_id", specialistId);
  if (delErr) return { error: delErr.message };

  if (slots.length === 0) return { error: null };

  const rows = slots.map((s) => ({
    specialist_id: specialistId,
    day_of_week: s.day_of_week,
    start_time: normalizeTime(s.start_time),
    end_time: normalizeTime(s.end_time),
    is_available: s.is_available,
  }));

  const { error: insErr } = await supabase.from("specialist_availability").insert(rows);
  if (insErr) return { error: insErr.message };
  return { error: null };
}
