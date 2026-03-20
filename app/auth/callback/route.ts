import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getRedirectPathForRole, type ProfileRole } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { getProfileRoles, resolveActiveRole } from "@/lib/services/roles.service";

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "";
  const code = url.searchParams.get("code");

  let user: User | null = null;
  const cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[] = [];

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      log.warn("auth/callback: missing Supabase env");
      return NextResponse.redirect(new URL("/login", url.origin));
    }
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSetFromAuth) {
          cookiesToSetFromAuth.forEach((c) =>
            cookiesToSet.push({ name: c.name, value: c.value, options: c.options })
          );
        },
      },
    });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      log.warn("auth/callback: exchangeCodeForSession error", { error: error.message });
      const loginUrl = new URL("/login", url.origin);
      if (next) loginUrl.searchParams.set("next", next);
      const res = NextResponse.redirect(loginUrl);
      cookiesToSet.forEach((c) => res.cookies.set(c.name, c.value, c.options as Record<string, unknown>));
      return res;
    }
    user = data.session?.user ?? data.user ?? null;
    log.info("auth/callback: code exchanged", { hasUser: !!user?.id });
  }

  if (!user?.id || !user.email) {
    log.info("auth/callback: no code or no user from code, checking getCurrentUser");
    const existingUser = await getCurrentUser();
    user = existingUser ?? null;
    log.info("auth/callback: getCurrentUser result", { hasUser: !!user?.id });
  }

  if (!user?.id || !user.email) {
    log.info("auth/callback: no session or user", { hasUser: !!user });
    const loginUrl = new URL("/login", url.origin);
    if (next) loginUrl.searchParams.set("next", next);
    const res = NextResponse.redirect(loginUrl);
    cookiesToSet.forEach((c) => res.cookies.set(c.name, c.value, c.options as Record<string, unknown>));
    return res;
  }

  // 2. Ensure there is a profile row; create one as patient if missing
  const supabase = getServerSupabase();
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id, role, active_role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    log.warn("auth/callback: profile select error", { error: selectError.message });
    const loginUrl = new URL("/login", url.origin);
    if (next) loginUrl.searchParams.set("next", next);
    const res = NextResponse.redirect(loginUrl);
    cookiesToSet.forEach((c) => res.cookies.set(c.name, c.value, c.options as Record<string, unknown>));
    return res;
  }

  let role: ProfileRole = (existing?.role as ProfileRole) ?? "patient";
  const activeRoleFromProfile = (existing?.active_role as ProfileRole | null) ?? null;

  if (!existing) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: (user.user_metadata as { full_name?: string } | null)?.full_name ?? null,
      role: "patient",
      is_active: true,
    });
    if (insertError) {
      log.warn("auth/callback: profile insert error", { error: insertError.message });
      const loginUrl = new URL("/login", url.origin);
      if (next) loginUrl.searchParams.set("next", next);
      const res = NextResponse.redirect(loginUrl);
      cookiesToSet.forEach((c) => res.cookies.set(c.name, c.value, c.options as Record<string, unknown>));
      return res;
    }
    role = "patient";
  } else if (existing.is_active === false) {
    log.info("auth/callback: profile inactive");
    const loginUrl = new URL("/login", url.origin);
    if (next) loginUrl.searchParams.set("next", next);
    const res = NextResponse.redirect(loginUrl);
    cookiesToSet.forEach((c) => res.cookies.set(c.name, c.value, c.options as Record<string, unknown>));
    return res;
  }

  // 3. Redirect using role-based path, honoring `next` when present
  const roleRows = await getProfileRoles(user.id);
  const availableRoles = roleRows.map((r) => r.role);
  const effectiveRole = resolveActiveRole(role, activeRoleFromProfile, availableRoles);
  const defaultPath = getRedirectPathForRole(effectiveRole);
  const targetPath = next || defaultPath || "/patient";
  const targetUrl = new URL(targetPath, url.origin);
  log.info("auth/callback: redirect", { role, activeRole: activeRoleFromProfile, effectiveRole, targetPath });

  const response = NextResponse.redirect(targetUrl);
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Record<string, unknown>);
  });
  return response;
}

