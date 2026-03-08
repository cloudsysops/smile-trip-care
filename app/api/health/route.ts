import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

/**
 * Liveness probe: app process is running.
 * Use for load balancers / orchestrators (e.g. GET /api/health).
 */
export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.GITHUB_SHA
    ?? process.env.COMMIT_SHA
    ?? "unknown";

  log.info("Health endpoint checked");
  return NextResponse.json({
    ok: true,
    status: "ok",
    version,
    time: new Date().toISOString(),
    request_id: requestId,
    service: "nebula-smile",
  });
}
