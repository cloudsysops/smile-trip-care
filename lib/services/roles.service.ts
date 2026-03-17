import { getServerSupabase } from "@/lib/supabase/server";
import type { ProfileRole } from "@/lib/auth";

export type ProfileRoleRow = {
  id: string;
  profile_id: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export async function getProfileRoles(profileId: string): Promise<ProfileRoleRow[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("profile_roles")
    .select("id, profile_id, role, is_active, created_at")
    .eq("profile_id", profileId)
    .eq("is_active", true);
  if (error || !data) return [];
  return data as ProfileRoleRow[];
}

export function resolveActiveRole(
  primaryRole: ProfileRole,
  activeRole: string | null,
  availableRoles: string[],
): ProfileRole {
  if (activeRole && availableRoles.includes(activeRole)) {
    return activeRole as ProfileRole;
  }
  return primaryRole;
}

