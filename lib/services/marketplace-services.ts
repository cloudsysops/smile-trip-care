import { getServerSupabase } from "@/lib/supabase/server";
import type { PublicServiceRow, ServiceCategory } from "@/lib/types/services-marketplace";

export type { PublicServiceRow, ServiceCategory } from "@/lib/types/services-marketplace";

type RawHost = { display_name?: string | null; city?: string | null } | null;

type RawService = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price_cents: number | string | null;
  price_per: string | null;
  city: string | null;
  duration_hours: number | string | null;
  hosts: RawHost | RawHost[];
};

function normalizeHost(hosts: RawHost | RawHost[]): RawHost {
  if (Array.isArray(hosts)) return hosts[0] ?? null;
  return hosts;
}

/** List active marketplace services; optional category filter (omit or "all" = every category). */
export async function listPublicServices(category?: string | null): Promise<PublicServiceRow[]> {
  const supabase = getServerSupabase();
  let q = supabase
    .from("services")
    .select(
      "id, name, description, category, price_cents, price_per, city, duration_hours, hosts(display_name, city)",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const cat = category?.trim().toLowerCase();
  if (cat && cat !== "all") {
    q = q.eq("category", cat);
  }

  const { data, error } = await q;
  if (error) {
    throw new Error(`listPublicServices: ${error.message}`);
  }

  const rows = (data ?? []) as RawService[];
  return rows.map((row) => {
    const h = normalizeHost(row.hosts);
    const pc =
      typeof row.price_cents === "number"
        ? row.price_cents
        : typeof row.price_cents === "string"
          ? Number(row.price_cents)
          : 0;
    const dh =
      typeof row.duration_hours === "number"
        ? row.duration_hours
        : typeof row.duration_hours === "string"
          ? Number(row.duration_hours)
          : null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category as ServiceCategory,
      price_cents: Number.isFinite(pc) ? pc : 0,
      price_per: row.price_per ?? "person",
      city: row.city,
      duration_hours: dh != null && Number.isFinite(dh) ? dh : null,
      host_name: h?.display_name?.trim() || null,
      host_city: h?.city?.trim() || null,
    };
  });
}
