import { getServerConfigSafe } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";

export type ExperienceRow = {
  id: string;
  name: string;
  city: string;
  category: string;
  description: string | null;
  price_cents: number | null;
  price_usd?: number | null;
  duration_hours: number | null;
  published: boolean;
  sort_order: number;
  provider_id?: string | null;
  slug?: string | null;
  includes?: string[] | null;
  created_at?: string;
  updated_at?: string;
};

export type ExperienceWithProvider = ExperienceRow & { provider_name: string | null };

const EXPERIENCE_SELECT =
  "id, name, city, category, description, price_cents, price_usd, duration_hours, published, sort_order, provider_id, slug, includes, created_at, updated_at";

/** Fetch published experiences. Returns [] if Supabase not configured or error. */
export async function getPublishedExperiences(): Promise<ExperienceRow[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("experiences")
      .select(EXPERIENCE_SELECT)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("name");
    if (error) return [];
    return (data ?? []) as ExperienceRow[];
  } catch {
    return [];
  }
}

export type ExperienceFilters = {
  city?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
};

/** Fetch published experiences with optional filters and provider name. */
export async function getPublishedExperiencesWithFilters(
  filters: ExperienceFilters = {}
): Promise<ExperienceWithProvider[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    let q = supabase
      .from("experiences")
      .select(`${EXPERIENCE_SELECT}, providers(name)`)
      .eq("published", true);
    if (filters.city) q = q.eq("city", filters.city);
    if (filters.category) q = q.eq("category", filters.category);
    if (filters.minPrice != null) q = q.gte("price_cents", filters.minPrice);
    if (filters.maxPrice != null) q = q.lte("price_cents", filters.maxPrice);
    if (filters.minDuration != null) q = q.gte("duration_hours", filters.minDuration);
    if (filters.maxDuration != null) q = q.lte("duration_hours", filters.maxDuration);
    const { data, error } = await q.order("sort_order", { ascending: true }).order("name");
    if (error) return [];
    return ((data ?? []) as (ExperienceRow & { providers: { name: string } | { name: string }[] | null })[]).map((e) => {
      const prov = e.providers;
      const name = Array.isArray(prov) ? prov[0]?.name : prov?.name;
      const { providers: _omit, ...rest } = e;
      void _omit;
      return { ...rest, provider_name: name ?? null } as ExperienceWithProvider;
    });
  } catch {
    return [];
  }
}

/** Fetch all experiences (admin). */
export async function getAllExperiences(): Promise<ExperienceRow[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("experiences")
      .select(EXPERIENCE_SELECT)
      .order("sort_order", { ascending: true })
      .order("name");
    if (error) return [];
    return (data ?? []) as ExperienceRow[];
  } catch {
    return [];
  }
}

/** Fetch one experience by id. Returns null if not found. */
export async function getExperienceById(id: string): Promise<ExperienceRow | null> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("experiences")
      .select(EXPERIENCE_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as ExperienceRow;
  } catch {
    return null;
  }
}

export type ExperienceInsert = Omit<ExperienceRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ExperienceUpsertResult = { data: ExperienceRow | null; error: string | null };

/** Create an experience (admin only). */
export async function createExperience(payload: ExperienceInsert): Promise<ExperienceUpsertResult> {
  try {
    const config = getServerConfigSafe();
    if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
      return { data: null, error: "Server config missing" };
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("experiences")
      .insert({
        name: payload.name,
        city: payload.city,
        category: payload.category ?? "other",
        description: payload.description ?? null,
        price_cents: payload.price_cents ?? null,
        price_usd: payload.price_usd ?? null,
        duration_hours: payload.duration_hours ?? null,
        slug: payload.slug ?? null,
        provider_id: payload.provider_id ?? null,
        includes: payload.includes ?? null,
        published: payload.published ?? false,
        sort_order: payload.sort_order ?? 0,
      })
      .select(EXPERIENCE_SELECT)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as ExperienceRow, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Update an experience (admin only). */
export async function updateExperience(id: string, payload: Partial<ExperienceInsert>): Promise<ExperienceUpsertResult> {
  try {
    const config = getServerConfigSafe();
    if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
      return { data: null, error: "Server config missing" };
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("experiences")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(EXPERIENCE_SELECT)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as ExperienceRow, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
