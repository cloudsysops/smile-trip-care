import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

/**
 * Liveness probe: app process is running.
 * Use for load balancers / orchestrators (e.g. GET /api/health).
 */
export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.GITHUB_SHA
    ?? process.env.COMMIT_SHA;

  log.info("Health endpoint checked");
  return NextResponse.json({
    ok: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "smile-transformation",
    request_id: requestId,
    ...(commit ? { commit } : {}),
  });
}
