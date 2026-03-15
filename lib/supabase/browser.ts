"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Supabase anon client for browser. Uses cookies so the server can read the session
 * after redirect (e.g. login -> /auth/callback). Returns null if env not set (e.g. build time).
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  browserClient = createBrowserClient(url, key);
  return browserClient;
}
