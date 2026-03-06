import { NextResponse } from "next/server";
import { getServerConfigSafe } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";

/**
 * Readiness probe: app can serve traffic (DB reachable, required config present).
 * Returns 200 if ready, 503 otherwise. Use for Kubernetes / load balancer ready checks.
 */
export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const checks: Record<string, "ok" | "missing" | "error"> = {};
  let ready = true;

  const config = getServerConfigSafe();
  const hasSupabase =
    config.success &&
    !!config.data.SUPABASE_URL &&
    !!config.data.SUPABASE_SERVICE_ROLE_KEY;
  checks.supabase_config = hasSupabase ? "ok" : "missing";
  if (!hasSupabase) ready = false;

  if (hasSupabase) {
    try {
      const supabase = getServerSupabase();
      const { error } = await supabase.from("packages").select("id").limit(1).maybeSingle();
      checks.supabase_connect = error ? "error" : "ok";
      if (error) ready = false;
    } catch {
      checks.supabase_connect = "error";
      ready = false;
    }
  } else {
    checks.supabase_connect = "missing";
  }

  const body = {
    ready,
    timestamp: new Date().toISOString(),
    request_id: requestId,
    checks,
  };

  log.info("Readiness endpoint checked", { ready, checks });
  return NextResponse.json(body, { status: ready ? 200 : 503 });
}
