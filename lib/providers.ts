import { getServerConfigSafe } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";

export type ProviderType = "clinic" | "tour_operator" | "specialist" | "hotel" | "transport" | "wellness";

export type ProviderApprovalStatus = "pending" | "approved" | "rejected" | "suspended";

export type ProviderRow = {
  id: string;
  name: string;
  type?: ProviderType;
  provider_type?: ProviderType | null;
  slug?: string | null;
  city: string;
  country?: string;
  description: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  website?: string | null;
  verified: boolean;
  featured_listing?: boolean;
  invited_by_provider_id?: string | null;
  approved_by?: string | null;
  approval_status?: ProviderApprovalStatus;
  is_family_network?: boolean;
  internal_notes?: string | null;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
};

const PROVIDER_SELECT_PUBLIC =
  "id, name, type, provider_type, slug, city, country, description, contact_email, contact_phone, website, verified, featured_listing, approval_status, is_family_network, published";
const PROVIDER_SELECT_ADMIN =
  "id, name, type, provider_type, slug, city, country, description, contact_email, contact_phone, website, verified, featured_listing, invited_by_provider_id, approved_by, approval_status, is_family_network, internal_notes, published, created_at, updated_at";

/** Fetch all providers (admin/catalog). Returns [] if Supabase not configured or error. */
export async function getProviders(): Promise<ProviderRow[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("providers")
      .select(PROVIDER_SELECT_ADMIN)
      .order("name");
    if (error) return [];
    return (data ?? []) as ProviderRow[];
  } catch {
    return [];
  }
}

/** Fetch only approved and published providers (for public-facing curated catalog). No internal_notes. */
export async function getApprovedProviders(): Promise<ProviderRow[]> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("providers")
      .select(PROVIDER_SELECT_PUBLIC)
      .eq("approval_status", "approved")
      .eq("published", true)
      .order("name");
    if (error) return [];
    return (data ?? []) as ProviderRow[];
  } catch {
    return [];
  }
}

/** Fetch one provider by id. Returns null if not found. */
export async function getProviderById(id: string): Promise<ProviderRow | null> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("providers")
      .select(PROVIDER_SELECT_ADMIN)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return data as ProviderRow;
  } catch {
    return null;
  }
}

/** Fetch one provider by slug (admin or public). Returns null if not found. */
export async function getProviderBySlug(slug: string): Promise<ProviderRow | null> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("providers")
      .select(PROVIDER_SELECT_ADMIN)
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return data as ProviderRow;
  } catch {
    return null;
  }
}

export type ProviderInsert = Omit<ProviderRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProviderUpsertResult = { data: ProviderRow | null; error: string | null };

/** Create a provider (admin only; call from API that checks is_admin). */
export async function createProvider(payload: ProviderInsert): Promise<ProviderUpsertResult> {
  try {
    const config = getServerConfigSafe();
    if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
      return { data: null, error: "Server config missing" };
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("providers")
      .insert({
        name: payload.name,
        type: payload.type ?? "clinic",
        slug: payload.slug ?? null,
        provider_type: payload.provider_type ?? null,
        city: payload.city,
        country: payload.country ?? "Colombia",
        description: payload.description ?? null,
        contact_email: payload.contact_email ?? null,
        contact_phone: payload.contact_phone ?? null,
        website: payload.website ?? null,
        verified: payload.verified ?? false,
        featured_listing: payload.featured_listing ?? false,
        invited_by_provider_id: payload.invited_by_provider_id ?? null,
        approved_by: payload.approved_by ?? null,
        approval_status: payload.approval_status ?? "pending",
        is_family_network: payload.is_family_network ?? false,
        internal_notes: payload.internal_notes ?? null,
        published: payload.published ?? false,
      })
      .select(PROVIDER_SELECT_ADMIN)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as ProviderRow, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Update a provider (admin only). */
export async function updateProvider(id: string, payload: Partial<ProviderInsert>): Promise<ProviderUpsertResult> {
  try {
    const config = getServerConfigSafe();
    if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
      return { data: null, error: "Server config missing" };
    }
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("providers")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(PROVIDER_SELECT_ADMIN)
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as ProviderRow, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
