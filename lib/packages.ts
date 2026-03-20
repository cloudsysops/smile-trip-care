import { getServerConfigSafe } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";

export type PackageType = "health" | "tour" | "combo";

export type PackageRow = {
  id: string;
  slug: string;
  name: string;
  location: string;
  recovery_city: string | null;
  description: string | null;
  duration_days: number | null;
  deposit_cents: number | null;
  included: string[] | null;
  itinerary_outline: string | null;
  published: boolean;
  badge: string | null;
  provider_id?: string | null;
  type?: PackageType;
  package_type?: PackageType | null;
  price_cents?: number | null;
  featured?: boolean;
  title?: string | null;
  subtitle?: string | null;
  origin_city?: string | null;
  destination_city?: string | null;
  price_from_usd?: number | null;
  highlights?: string[] | null;
  includes?: string[] | null;
  excludes?: string[] | null;
  updated_at?: string | null;
};

export type PackageWithProvider = PackageRow & { provider_name: string | null };

export type PackageExperienceLink = { package_id: string; experience_id: string; is_included: boolean; sort_order: number };
export type PackageSpecialistLink = { package_id: string; specialist_id: string; is_primary: boolean };

export type PackageWithRelations = PackageRow & {
  provider_name?: string | null;
  package_experiences?: PackageExperienceLink[];
  package_specialists?: PackageSpecialistLink[];
};

const PACKAGE_SELECT =
  "id, slug, name, location, recovery_city, description, duration_days, deposit_cents, included, itinerary_outline, published, badge, provider_id, type, package_type, price_cents, featured, title, subtitle, origin_city, destination_city, price_from_usd, highlights, includes, excludes, updated_at";

/** Fetch published packages. Returns [] if Supabase not configured or error. */
export async function getPublishedPackages(): Promise<PackageRow[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("packages")
      .select(PACKAGE_SELECT)
      .eq("published", true)
      .order("slug");
    if (error) return [];
    return (data ?? []) as PackageRow[];
  } catch {
    return [];
  }
}

export type PackageFilters = {
  type?: PackageType;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
};

/** Fetch published packages with optional filters and provider name. */
export async function getPublishedPackagesWithFilters(
  filters: PackageFilters = {}
): Promise<PackageWithProvider[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    let q = supabase
      .from("packages")
      .select(`${PACKAGE_SELECT}, providers(name)`)
      .eq("published", true);
    if (filters.type) q = q.eq("type", filters.type);
    if (filters.city) q = q.or(`location.eq.${filters.city},recovery_city.eq.${filters.city}`);
    if (filters.minPrice != null) q = q.gte("price_cents", filters.minPrice);
    if (filters.maxPrice != null) q = q.lte("price_cents", filters.maxPrice);
    if (filters.minDuration != null) q = q.gte("duration_days", filters.minDuration);
    if (filters.maxDuration != null) q = q.lte("duration_days", filters.maxDuration);
    const { data, error } = await q.order("slug");
    if (error) return [];
    return ((data ?? []) as (PackageRow & { providers: { name: string } | { name: string }[] | null })[]).map((p) => {
      const prov = p.providers;
      const name = Array.isArray(prov) ? prov[0]?.name : prov?.name;
      const { providers: _omit, ...rest } = p;
      void _omit;
      return { ...rest, provider_name: name ?? null } as PackageWithProvider;
    });
  } catch {
    return [];
  }
}

/** Fetch one published package by slug. Returns null if not found or not published. */
export async function getPublishedPackageBySlug(slug: string): Promise<PackageRow | null> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("packages")
      .select(PACKAGE_SELECT)
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) return null;
    return data as PackageRow;
  } catch {
    return null;
  }
}

/** Fetch all packages (admin). */
export async function getAllPackages(): Promise<PackageRow[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("packages")
      .select(PACKAGE_SELECT)
      .order("slug");
    if (error) return [];
    return (data ?? []) as PackageRow[];
  } catch {
    return [];
  }
}

/** Fetch one package by id (admin; any publish state). */
export async function getPackageById(id: string): Promise<PackageRow | null> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("packages")
      .select(PACKAGE_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as PackageRow;
  } catch {
    return null;
  }
}

/** Fetch package with junction relations (package_experiences, package_specialists). */
export async function getPackageWithRelations(id: string): Promise<PackageWithRelations | null> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const supabase = getServerSupabase();
    const { data: pkg, error: pkgError } = await supabase
      .from("packages")
      .select(`${PACKAGE_SELECT}, providers(name)`)
      .eq("id", id)
      .maybeSingle();
    if (pkgError || !pkg) return null;
    const { data: pe, error: peError } = await supabase
      .from("package_experiences")
      .select("package_id, experience_id, is_included, sort_order")
      .eq("package_id", id);
    const { data: ps, error: psError } = await supabase
      .from("package_specialists")
      .select("package_id, specialist_id, is_primary")
      .eq("package_id", id);
    const prov = (pkg as Record<string, unknown>).providers;
    const provider_name =
      prov && typeof prov === "object" && "name" in prov && typeof (prov as { name: string }).name === "string"
        ? (prov as { name: string }).name
        : Array.isArray(prov) && prov[0] && typeof prov[0] === "object" && "name" in prov[0]
          ? (prov[0] as { name: string }).name
          : null;
    const { providers: _prov, ...rest } = pkg as PackageRow & { providers?: unknown };
    void _prov;
    return {
      ...rest,
      provider_name: provider_name ?? null,
      package_experiences: peError ? [] : (pe ?? []).map((r) => ({ package_id: r.package_id, experience_id: r.experience_id, is_included: r.is_included ?? false, sort_order: r.sort_order ?? 0 })),
      package_specialists: psError ? [] : (ps ?? []).map((r) => ({ package_id: r.package_id, specialist_id: r.specialist_id, is_primary: r.is_primary ?? false })),
    } as PackageWithRelations;
  } catch {
    return null;
  }
}

export type PackageUpdatePayload = Partial<
  Omit<PackageRow, "id" | "slug" | "created_at">
>;

export type PackageUpdateResult = { data: PackageRow | null; error: string | null };

/** Update a package (admin only). */
export async function updatePackage(id: string, payload: PackageUpdatePayload): Promise<PackageUpdateResult> {
  try {
    const config = getServerConfigSafe();
    if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
      return { data: null, error: "Server config missing" };
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("packages")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(PACKAGE_SELECT)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as PackageRow, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
