import { getServerSupabase } from "@/lib/supabase/server";
import type { HostProfilePatch } from "@/lib/validation/host-profile";
import type { HostExperienceCreate, HostExperiencePatch } from "@/lib/validation/host-experience";

export type Host = {
  id: string;
  profile_id: string;
  display_name: string;
  city: string | null;
  bio: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_active: boolean;
  created_at: string;
  stripe_account_id?: string | null;
  stripe_onboarding_complete?: boolean | null;
  stripe_details_submitted?: boolean | null;
};

export async function getHostByProfileId(profileId: string): Promise<Host | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("hosts")
    .select(
      "id, profile_id, display_name, city, bio, phone, whatsapp, is_active, created_at, stripe_account_id, stripe_onboarding_complete, stripe_details_submitted",
    )
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as Host;
}

export async function getHostById(hostId: string): Promise<Host | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("hosts")
    .select(
      "id, profile_id, display_name, city, bio, phone, whatsapp, is_active, created_at, stripe_account_id, stripe_onboarding_complete, stripe_details_submitted",
    )
    .eq("id", hostId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Host;
}

/** Update host row; caller must ensure profile owns this host. */
export async function updateHostForProfile(
  hostId: string,
  profileId: string,
  patch: HostProfilePatch,
): Promise<{ ok: true; host: Host } | { ok: false; error: string }> {
  const supabase = getServerSupabase();
  const row: Record<string, unknown> = {};
  if (patch.display_name !== undefined) row.display_name = patch.display_name;
  if (patch.bio !== undefined) row.bio = patch.bio;
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.phone !== undefined) row.phone = patch.phone;
  if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp;
  if (Object.keys(row).length === 0) {
    const h = await getHostByProfileId(profileId);
    if (!h || h.id !== hostId) return { ok: false, error: "Not found" };
    return { ok: true, host: h };
  }
  const { data, error } = await supabase
    .from("hosts")
    .update(row)
    .eq("id", hostId)
    .eq("profile_id", profileId)
    .select(
      "id, profile_id, display_name, city, bio, phone, whatsapp, is_active, created_at, stripe_account_id, stripe_onboarding_complete, stripe_details_submitted",
    )
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Update failed" };
  return { ok: true, host: data as Host };
}

export type HostExperienceRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  base_price_cents: number | null;
  city: string | null;
  published: boolean;
  is_active: boolean;
  host_id: string | null;
};

const HOST_EXPERIENCE_SELECT =
  "id, name, description, category, base_price_cents, city, published, is_active, host_id";

export async function listHostExperiences(hostId: string): Promise<HostExperienceRow[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("experiences")
    .select(HOST_EXPERIENCE_SELECT)
    .eq("host_id", hostId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name");

  if (error || !data) return [];
  return data as HostExperienceRow[];
}

export async function getHostExperienceById(
  hostId: string,
  experienceId: string,
): Promise<HostExperienceRow | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("experiences")
    .select(HOST_EXPERIENCE_SELECT)
    .eq("id", experienceId)
    .eq("host_id", hostId)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as HostExperienceRow;
}

export async function createHostExperience(
  hostId: string,
  payload: HostExperienceCreate,
): Promise<{ ok: true; row: HostExperienceRow } | { ok: false; error: string }> {
  const supabase = getServerSupabase();
  const slugBase = payload.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 80);
  const unique = crypto.randomUUID().slice(0, 8);
  const slug =
    slugBase.length > 0 ? `${slugBase}-${unique}` : `experience-${unique}`;
  const { data, error } = await supabase
    .from("experiences")
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      category: payload.category ?? "other",
      base_price_cents: payload.base_price_cents,
      city: payload.city,
      host_id: hostId,
      published: payload.published ?? false,
      is_active: true,
      sort_order: 0,
      slug,
      price_cents: payload.base_price_cents,
    })
    .select(HOST_EXPERIENCE_SELECT)
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed" };
  return { ok: true, row: data as HostExperienceRow };
}

export async function updateHostExperience(
  hostId: string,
  experienceId: string,
  patch: HostExperiencePatch,
): Promise<{ ok: true; row: HostExperienceRow } | { ok: false; error: string }> {
  const supabase = getServerSupabase();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.base_price_cents !== undefined) {
    row.base_price_cents = patch.base_price_cents;
    row.price_cents = patch.base_price_cents;
  }
  if (patch.city !== undefined) row.city = patch.city;
  if (patch.published !== undefined) row.published = patch.published;
  const { data, error } = await supabase
    .from("experiences")
    .update(row)
    .eq("id", experienceId)
    .eq("host_id", hostId)
    .select(HOST_EXPERIENCE_SELECT)
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Update failed" };
  return { ok: true, row: data as HostExperienceRow };
}

export async function softDeleteHostExperience(
  hostId: string,
  experienceId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("experiences")
    .update({ is_active: false, published: false, updated_at: new Date().toISOString() })
    .eq("id", experienceId)
    .eq("host_id", hostId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type HostDashboardStats = {
  active_experiences: number;
  total_bookings: number;
  active_bookings: number;
  revenue_cents: number;
};

export async function getHostDashboardStats(hostId: string): Promise<HostDashboardStats> {
  const supabase = getServerSupabase();
  const { count: expCount } = await supabase
    .from("experiences")
    .select("id", { count: "exact", head: true })
    .eq("host_id", hostId)
    .eq("is_active", true);

  const { data: expRows } = await supabase.from("experiences").select("id").eq("host_id", hostId).eq("is_active", true);
  const experienceIds = (expRows ?? []).map((r) => r.id as string);
  if (experienceIds.length === 0) {
    return {
      active_experiences: expCount ?? 0,
      total_bookings: 0,
      active_bookings: 0,
      revenue_cents: 0,
    };
  }

  const { data: peRows } = await supabase
    .from("package_experiences")
    .select("package_id")
    .in("experience_id", experienceIds);
  const packageIds = [...new Set((peRows ?? []).map((r) => r.package_id as string).filter(Boolean))];
  if (packageIds.length === 0) {
    return {
      active_experiences: expCount ?? 0,
      total_bookings: 0,
      active_bookings: 0,
      revenue_cents: 0,
    };
  }

  const { data: bookingRows } = await supabase
    .from("bookings")
    .select("id, lead_id, status")
    .in("package_id", packageIds);
  const bookings = bookingRows ?? [];
  const leadIds = [...new Set(bookings.map((b) => b.lead_id as string).filter(Boolean))];
  const total_bookings = bookings.length;
  const active_bookings = bookings.filter((b) => b.status === "pending" || b.status === "deposit_paid").length;

  let revenue_cents = 0;
  if (leadIds.length > 0) {
    const { data: payRows } = await supabase
      .from("payments")
      .select("amount_cents")
      .in("lead_id", leadIds)
      .eq("status", "succeeded");
    for (const row of payRows ?? []) {
      const cents = row.amount_cents;
      if (typeof cents === "number" && Number.isFinite(cents)) revenue_cents += cents;
    }
  }

  return {
    active_experiences: expCount ?? 0,
    total_bookings,
    active_bookings,
    revenue_cents,
  };
}

export type HostExperience = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  base_price_cents: number | null;
  city: string | null;
};

/** @deprecated Prefer listHostExperiences */
export async function getHostExperiences(hostId: string): Promise<HostExperience[]> {
  const rows = await listHostExperiences(hostId);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    base_price_cents: r.base_price_cents,
    city: r.city,
  }));
}

export type HostBookingRow = {
  id: string;
  lead_id: string;
  package_id: string;
  status: string;
  created_at: string | null;
};

export async function listHostBookings(hostId: string): Promise<HostBookingRow[]> {
  const supabase = getServerSupabase();
  const { data: expRows } = await supabase.from("experiences").select("id").eq("host_id", hostId).eq("is_active", true);
  const experienceIds = (expRows ?? []).map((r) => r.id as string);
  if (experienceIds.length === 0) return [];

  const { data: peRows } = await supabase
    .from("package_experiences")
    .select("package_id")
    .in("experience_id", experienceIds);
  const packageIds = [...new Set((peRows ?? []).map((r) => r.package_id as string).filter(Boolean))];
  if (packageIds.length === 0) return [];

  const { data: bookingRows } = await supabase
    .from("bookings")
    .select("id, lead_id, package_id, status, created_at")
    .in("package_id", packageIds)
    .order("created_at", { ascending: false })
    .limit(100);

  return (bookingRows ?? []) as HostBookingRow[];
}
