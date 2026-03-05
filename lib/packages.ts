import { getServerConfigSafe } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";

export type PackageRow = {
  id: string;
  slug: string;
  name: string;
  location: string;
  description: string | null;
  duration_days: number | null;
  deposit_cents: number | null;
  included: string[] | null;
  itinerary_outline: string | null;
  published: boolean;
};

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
      .select("id, slug, name, location, description, duration_days, deposit_cents, included, itinerary_outline, published")
      .eq("published", true)
      .order("slug");
    if (error) return [];
    return (data ?? []) as PackageRow[];
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
      .select("id, slug, name, location, description, duration_days, deposit_cents, included, itinerary_outline, published")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();
    if (error || !data) return null;
    return data as PackageRow;
  } catch {
    return null;
  }
}
