import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getServerSupabase } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { getProfileRoles, resolveActiveRole } from "@/lib/services/roles.service";

export type ProfileRole =
  | "admin"
  | "coordinator"
  | "provider_manager"
  | "host"
  | "specialist"
  | "patient"
  | "user";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ProfileRole;
  active_role: ProfileRole | null;
  provider_id: string | null;
  specialist_id: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * Get Supabase auth client for current request (cookies). Use in Route Handlers and Server Components.
 */
export async function getAuthClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Route handlers don't need to set cookies; proxy already refreshed.
      },
    },
  });
}

/** Get current user from session. Returns null if not authenticated. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const PROFILE_SELECT =
  "id, email, full_name, role, active_role, provider_id, specialist_id, is_active, created_at, updated_at";

/**
 * Get current user's profile from profiles table. Returns null if not authenticated or no profile / inactive.
 */
export async function getCurrentProfile(): Promise<{ user: User; profile: Profile } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = getServerSupabase();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .single();
  if (error || !profile?.is_active) return null;
  return {
    user,
    profile: {
      id: profile.id,
      email: profile.email ?? null,
      full_name: profile.full_name ?? null,
      role: profile.role as ProfileRole,
      active_role: (profile.active_role as ProfileRole | null) ?? null,
      provider_id: profile.provider_id ?? null,
      specialist_id: profile.specialist_id ?? null,
      is_active: profile.is_active ?? true,
      created_at: profile.created_at ?? null,
      updated_at: profile.updated_at ?? null,
    },
  };
}

type RedirectRole = "admin" | "coordinator" | "provider_manager" | "host" | "specialist" | "patient";

/** Resolve role for redirect: treat legacy 'user' as patient. */
export function roleRedirectRole(role: ProfileRole): RedirectRole {
  if (role === "user") return "patient";
  if (role === "host") return "host";
  return role === "admin" || role === "coordinator" || role === "provider_manager" || role === "specialist" || role === "patient"
    ? role
    : "patient";
}

/** Redirect path by role after login. */
export function getRedirectPathForRole(role: ProfileRole): string {
  const r = roleRedirectRole(role);
  switch (r) {
    case "admin":
      return "/admin/overview";
    case "coordinator":
      return "/coordinator";
    case "provider_manager":
      return "/provider";
    case "host":
      return "/host";
    case "specialist":
      return "/specialist";
    case "patient":
      return "/patient";
    default:
      return "/patient";
  }
}

/**
 * Effective role resolution for multi-role users.
 * - If `profile.active_role` exists and is assigned in `profile_roles`, use it.
 * - Else, prefer `profile.role` if assigned.
 * - Else, fallback to first assigned role.
 * - Else, fallback to `profile.role` (safe).
 */
export async function getEffectiveRoleForProfile(profile: Profile): Promise<ProfileRole> {
  const rolesRows = await getProfileRoles(profile.id);
  const availableRoles = rolesRows.map((r) => r.role);
  return resolveActiveRole(profile.role, profile.active_role ?? null, availableRoles);
}

/**
 * Require admin: get user + profile, check role = 'admin'. Throws if not admin.
 */
export async function requireAdmin(): Promise<{ user: User; profile: Profile }> {
  const ctx = await getCurrentProfile();
  if (!ctx) throw new Error("Unauthorized");
  const effectiveRole = await getEffectiveRoleForProfile(ctx.profile);
  if (effectiveRole !== "admin") throw new Error("Forbidden");
  return { user: ctx.user, profile: ctx.profile };
}

/**
 * Require coordinator: role must be coordinator or admin. Throws otherwise.
 */
export async function requireCoordinator(): Promise<{ user: User; profile: Profile }> {
  const ctx = await getCurrentProfile();
  if (!ctx) throw new Error("Unauthorized");
  const effectiveRole = await getEffectiveRoleForProfile(ctx.profile);
  if (effectiveRole !== "coordinator" && effectiveRole !== "admin") {
    throw new Error("Forbidden");
  }
  return { user: ctx.user, profile: ctx.profile };
}

/**
 * Require provider_manager: role must be provider_manager or admin. Throws otherwise.
 */
export async function requireProviderManager(): Promise<{ user: User; profile: Profile }> {
  const ctx = await getCurrentProfile();
  if (!ctx) throw new Error("Unauthorized");
  const effectiveRole = await getEffectiveRoleForProfile(ctx.profile);
  if (effectiveRole !== "provider_manager" && effectiveRole !== "admin") {
    throw new Error("Forbidden");
  }
  return { user: ctx.user, profile: ctx.profile };
}

/**
 * Require specialist: role must be specialist or admin. Throws otherwise.
 */
export async function requireSpecialist(): Promise<{ user: User; profile: Profile }> {
  const ctx = await getCurrentProfile();
  if (!ctx) throw new Error("Unauthorized");
  const effectiveRole = await getEffectiveRoleForProfile(ctx.profile);
  if (effectiveRole !== "specialist" && effectiveRole !== "admin") {
    throw new Error("Forbidden");
  }
  return { user: ctx.user, profile: ctx.profile };
}

/**
 * Require patient: role must be patient, user (legacy), or admin. Throws otherwise.
 */
export async function requirePatient(): Promise<{ user: User; profile: Profile }> {
  const ctx = await getCurrentProfile();
  if (!ctx) throw new Error("Unauthorized");
  const effectiveRole = await getEffectiveRoleForProfile(ctx.profile);
  const ok =
    effectiveRole === "patient" ||
    effectiveRole === "user" ||
    effectiveRole === "admin";
  if (!ok) throw new Error("Forbidden");
  return { user: ctx.user, profile: ctx.profile };
}
