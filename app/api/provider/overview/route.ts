import { NextResponse } from "next/server";
import { requireProviderManager } from "@/lib/auth";
import { getProviderOverviewMetrics } from "@/lib/dashboard-data";
import { createLogger } from "@/lib/logger";

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    const { profile } = await requireProviderManager();
    const providerId = profile.provider_id?.trim() ?? "";
    if (!providerId) {
      return NextResponse.json(
        { error: "Provider not linked to this account", request_id: requestId },
        { status: 400 },
      );
    }
    const metrics = await getProviderOverviewMetrics(providerId);
    return NextResponse.json({
      ...metrics,
      request_id: requestId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
    }
    if (msg === "Forbidden") {
      return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
    }
    log.error("GET /api/provider/overview failed", { err: msg });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
