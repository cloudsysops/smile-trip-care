import { getServerSupabase } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { ProfileRole } from "@/lib/auth";

type Logger = {
  error: (message: string, meta?: Record<string, unknown>) => void;
};

export type EnsurePatientProfileResult = {
  created: boolean;
};

/**
 * Ensure that a patient profile exists for the given auth user.
 * Used by POST /api/signup.
 */
export async function ensurePatientProfileForUser(
  user: User,
  fullName: string | null,
  log: Logger,
): Promise<EnsurePatientProfileResult> {
  const supabase = getServerSupabase();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { created: false };
  }

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email,
    full_name: fullName ?? (user.user_metadata as { full_name?: string } | null)?.full_name ?? null,
    role: "patient" as ProfileRole,
    is_active: true,
  });

  if (error) {
    log.error("Signup profile insert failed", { error: error.message, user_id: user.id });
    throw new Error("profile_insert_failed");
  }

  return { created: true };
}

/**
 * Get or create a patient profile for the given auth user.
 * Not yet wired to any route but provided for future use.
 */
export async function getOrCreatePatientProfile(
  user: User,
  fullName: string | null,
  log: Logger,
) {
  const supabase = getServerSupabase();
  const { data: existing, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    log.error("getOrCreatePatientProfile: select failed", { error: error.message, user_id: user.id });
    throw new Error("profile_select_failed");
  }

  if (existing) {
    return existing;
  }

  const { error: insertError } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email,
    full_name: fullName ?? (user.user_metadata as { full_name?: string } | null)?.full_name ?? null,
    role: "patient" as ProfileRole,
    is_active: true,
  });

  if (insertError) {
    log.error("getOrCreatePatientProfile: insert failed", {
      error: insertError.message,
      user_id: user.id,
    });
    throw new Error("profile_insert_failed");
  }

  const { data: created } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return created;
}

