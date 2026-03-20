import { getServerConfigSafe } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";

export type SpecialistApprovalStatus = "pending" | "approved" | "rejected" | "suspended";

export type SpecialistRow = {
  id: string;
  name: string;
  specialty: string;
  city: string;
  clinic: string | null;
  clinic_name?: string | null;
  description: string | null;
  published: boolean;
  sort_order: number;
  slug?: string | null;
  provider_id?: string | null;
  bio?: string | null;
  photo_asset_id?: string | null;
  free_evaluation?: boolean;
  recommended_by_provider_id?: string | null;
  approval_status?: SpecialistApprovalStatus;
  created_at?: string;
  updated_at?: string;
};

const SPECIALIST_SELECT =
  "id, name, specialty, city, clinic, clinic_name, description, published, sort_order, slug, provider_id, bio, photo_asset_id, free_evaluation, recommended_by_provider_id, approval_status, created_at, updated_at";

/** Fetch published and approved specialists (curated network). Returns [] if Supabase not configured or error. */
export async function getPublishedSpecialists(): Promise<SpecialistRow[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("specialists")
      .select(SPECIALIST_SELECT)
      .eq("published", true)
      .eq("approval_status", "approved")
      .order("sort_order", { ascending: true })
      .order("name");
    if (error) return [];
    return (data ?? []) as SpecialistRow[];
  } catch {
    return [];
  }
}

/** Fetch all specialists (admin). */
export async function getAllSpecialists(): Promise<SpecialistRow[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("specialists")
      .select(SPECIALIST_SELECT)
      .order("sort_order", { ascending: true })
      .order("name");
    if (error) return [];
    return (data ?? []) as SpecialistRow[];
  } catch {
    return [];
  }
}

/** Fetch one specialist by id. Returns null if not found. */
export async function getSpecialistById(id: string): Promise<SpecialistRow | null> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("specialists")
      .select(SPECIALIST_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as SpecialistRow;
  } catch {
    return null;
  }
}

/** Fetch one published specialist by slug (for public profile page). Returns null if not found. */
export async function getSpecialistBySlug(slug: string): Promise<SpecialistRow | null> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("specialists")
      .select(SPECIALIST_SELECT)
      .eq("slug", slug)
      .eq("published", true)
      .eq("approval_status", "approved")
      .maybeSingle();
    if (error || !data) return null;
    return data as SpecialistRow;
  } catch {
    return null;
  }
}

export type RecommendedSpecialistParams = {
  /** Preferred city (e.g. from package location: Medellín, Manizales). */
  cityPreference: string;
  /** Optional treatment types from lead (e.g. selected_specialties). Used to prefer matching specialty. */
  treatmentTypes?: string[];
};

/**
 * Match a specialist for post-assessment recommendation.
 * Logic: city match + optional specialty/treatment type match. Later replaceable by AI matching.
 */
export async function getRecommendedSpecialist(
  params: RecommendedSpecialistParams,
): Promise<SpecialistRow | null> {
  const { cityPreference, treatmentTypes } = params;
  const candidates = await getPublishedSpecialists();
  if (candidates.length === 0) return null;

  const cityNorm = cityPreference.trim().toLowerCase();
  const byCity = candidates.filter(
    (s) => (s.city ?? "").trim().toLowerCase() === cityNorm,
  );
  const pool = byCity.length > 0 ? byCity : candidates;

  if (!treatmentTypes || treatmentTypes.length === 0) {
    return pool[0] ?? null;
  }

  const typesNorm = treatmentTypes.map((t) => t.trim().toLowerCase()).filter(Boolean);
  const withSpecialtyMatch = pool.find((s) => {
    const spec = (s.specialty ?? "").toLowerCase();
    return typesNorm.some((t) => spec.includes(t) || t.includes(spec));
  });
  return withSpecialtyMatch ?? pool[0] ?? null;
}

export type SpecialistInsert = Omit<SpecialistRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type SpecialistUpsertResult = { data: SpecialistRow | null; error: string | null };

/** Create a specialist (admin only). */
export async function createSpecialist(payload: SpecialistInsert): Promise<SpecialistUpsertResult> {
  try {
    const config = getServerConfigSafe();
    if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
      return { data: null, error: "Server config missing" };
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("specialists")
      .insert({
        name: payload.name,
        specialty: payload.specialty,
        city: payload.city,
        clinic: payload.clinic ?? null,
        clinic_name: payload.clinic_name ?? null,
        description: payload.description ?? null,
        slug: payload.slug ?? null,
        provider_id: payload.provider_id ?? null,
        bio: payload.bio ?? null,
        photo_asset_id: payload.photo_asset_id ?? null,
        free_evaluation: payload.free_evaluation ?? true,
        recommended_by_provider_id: payload.recommended_by_provider_id ?? null,
        approval_status: payload.approval_status ?? "pending",
        published: payload.published ?? false,
        sort_order: payload.sort_order ?? 0,
      })
      .select(SPECIALIST_SELECT)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as SpecialistRow, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Update a specialist (admin only). */
export async function updateSpecialist(id: string, payload: Partial<SpecialistInsert>): Promise<SpecialistUpsertResult> {
  try {
    const config = getServerConfigSafe();
    if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
      return { data: null, error: "Server config missing" };
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("specialists")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(SPECIALIST_SELECT)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as SpecialistRow, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
