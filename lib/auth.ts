import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getServerSupabase } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

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

/**
 * Require admin: get user, check profiles.role = 'admin' via service role. Throws if not admin.
 */
export async function requireAdmin(): Promise<{ user: User }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const supabase = getServerSupabase();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (error || !profile || profile.role !== "admin") {
    throw new Error("Forbidden");
  }
  return { user };
}
