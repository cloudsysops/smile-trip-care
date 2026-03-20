/**
 * Server-only lead reads for thank-you and matching. Uses service role.
 */
import { getServerConfigSafe } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";

export type LeadMatchContext = {
  package_id: string | null;
  recommended_package_id: string | null;
  selected_specialties: string[];
};

/**
 * Fetch minimal lead fields for specialist matching (thank-you page).
 * Returns null if lead not found or config missing.
 */
export async function getLeadByIdForMatching(leadId: string): Promise<LeadMatchContext | null> {
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("leads")
      .select("package_id, recommended_package_id, selected_specialties")
      .eq("id", leadId)
      .maybeSingle();
    if (error || !data) return null;
    const raw = data as {
      package_id: string | null;
      recommended_package_id: string | null;
      selected_specialties: unknown;
    };
    const selected_specialties = Array.isArray(raw.selected_specialties)
      ? (raw.selected_specialties as string[]).filter((s) => typeof s === "string" && s.trim().length > 0)
      : [];
    return {
      package_id: raw.package_id ?? null,
      recommended_package_id: raw.recommended_package_id ?? null,
      selected_specialties,
    };
  } catch {
    return null;
  }
}
