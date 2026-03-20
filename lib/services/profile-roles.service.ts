import type { ProfileRole } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";

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
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as ProfileRoleRow[];
}

export function getActiveRoleFromProfile(profile: { role: ProfileRole; active_role?: string | null }): ProfileRole {
  if (profile.active_role && typeof profile.active_role === "string") {
    return profile.active_role as ProfileRole;
  }
  return profile.role;
}

