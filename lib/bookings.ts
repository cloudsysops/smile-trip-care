import { getServerConfigSafe } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";

export type BookingStatus =
  | "draft"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "pending"
  | "deposit_paid";

export type BookingRow = {
  id: string;
  lead_id: string;
  package_id: string;
  provider_id: string | null;
  status: BookingStatus;
  total_price_usd: number | null;
  deposit_paid: boolean;
  deposit_cents: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const BOOKING_SELECT =
  "id, lead_id, package_id, provider_id, status, total_price_usd, deposit_paid, deposit_cents, start_date, end_date, notes, created_at, updated_at";

/** Fetch all bookings (admin). */
export async function getBookings(): Promise<BookingRow[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as BookingRow[];
  } catch {
    return [];
  }
}

/** Fetch bookings by lead_id. */
export async function getBookingsByLeadId(leadId: string): Promise<BookingRow[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as BookingRow[];
  } catch {
    return [];
  }
}

/** Fetch one booking by id. */
export async function getBookingById(id: string): Promise<BookingRow | null> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as BookingRow;
  } catch {
    return null;
  }
}

export type BookingInsert = Omit<BookingRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type BookingUpsertResult = { data: BookingRow | null; error: string | null };

/** Create a booking (admin or system e.g. lead flow). */
export async function createBooking(payload: BookingInsert): Promise<BookingUpsertResult> {
  try {
    const config = getServerConfigSafe();
    if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
      return { data: null, error: "Server config missing" };
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        lead_id: payload.lead_id,
        package_id: payload.package_id,
        provider_id: payload.provider_id ?? null,
        status: payload.status ?? "draft",
        total_price_usd: payload.total_price_usd ?? null,
        deposit_paid: payload.deposit_paid ?? false,
        deposit_cents: payload.deposit_cents ?? null,
        start_date: payload.start_date ?? null,
        end_date: payload.end_date ?? null,
        notes: payload.notes ?? null,
      })
      .select(BOOKING_SELECT)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as BookingRow, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Update a booking (admin only). */
export async function updateBooking(id: string, payload: Partial<BookingInsert>): Promise<BookingUpsertResult> {
  try {
    const config = getServerConfigSafe();
    if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
      return { data: null, error: "Server config missing" };
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("bookings")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(BOOKING_SELECT)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as BookingRow, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
