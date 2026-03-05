import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerConfigSafe } from "@/lib/config/server";

let serverClient: SupabaseClient | null = null;

/**
 * Supabase client with service role. Use only in server code (API routes, server components, server actions).
 * All writes must go through this client. Never expose service role key to client.
 */
export function getServerSupabase(): SupabaseClient {
  if (serverClient) return serverClient;
  const config = getServerConfigSafe();
  if (!config.success || !config.data.SUPABASE_URL || !config.data.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase server config missing: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }
  serverClient = createClient(config.data.SUPABASE_URL, config.data.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  return serverClient;
}
