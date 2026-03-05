import { NextResponse } from "next/server";

/**
 * Liveness probe: app process is running.
 * Use for load balancers / orchestrators (e.g. GET /api/health).
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "smile-transformation-platform",
  });
}
