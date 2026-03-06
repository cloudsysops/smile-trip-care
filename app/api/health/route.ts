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
  const version = process.env.npm_package_version;

  return NextResponse.json({
    ok: true,
    service: "smile-transformation",
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV ? { environment: process.env.NODE_ENV } : {}),
    ...(version ? { version } : {}),
    ...(commit ? { commit } : {}),
  });
}
