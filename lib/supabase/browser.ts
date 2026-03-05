"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Supabase anon client for browser. Use for public reads only (RLS enforced).
 * Never use for writes; use server client with service role for writes.
 * Returns null if env not set (e.g. build time).
 */
export function getBrowserSupabase(): SupabaseClient | null {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  browserClient = createClient(url, key);
  return browserClient;
}
