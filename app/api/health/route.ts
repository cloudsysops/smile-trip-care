import { NextResponse } from "next/server";

/**
 * Liveness probe: app process is running.
 * Use for load balancers / orchestrators (e.g. GET /api/health).
 */
export async function GET() {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.GITHUB_SHA
    ?? process.env.COMMIT_SHA;

  return NextResponse.json({
    ok: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "smile-transformation",
    ...(commit ? { commit } : {}),
  });
}
