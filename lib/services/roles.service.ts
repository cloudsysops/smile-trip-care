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
  const KNOWN_ROLES: readonly ProfileRole[] = [
    "admin",
    "coordinator",
    "provider_manager",
    "specialist",
    "patient",
    "user",
    "host",
  ];

  const availableKnown = availableRoles.filter((r): r is ProfileRole => KNOWN_ROLES.includes(r as ProfileRole));

  if (activeRole) {
    const activeKnown = KNOWN_ROLES.includes(activeRole as ProfileRole) ? (activeRole as ProfileRole) : null;
    if (activeKnown && availableKnown.includes(activeKnown)) {
      return activeKnown;
    }
  }

  // If active role is missing/invalid, use primary role only if the profile has it assigned.
  if (availableKnown.includes(primaryRole)) {
    return primaryRole;
  }

  // As a safe fallback, pick the first assigned role.
  if (availableKnown.length > 0) {
    return availableKnown[0];
  }

  return primaryRole;
}

