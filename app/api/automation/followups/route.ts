import { NextResponse } from "next/server";
import { enqueueInactiveFollowupJobs } from "@/lib/ai/automation";
import { createLogger } from "@/lib/logger";
import { getServerConfigSafe } from "@/lib/config/server";

export const runtime = "nodejs";

function readProvidedSecret(request: Request): string | null {
  const direct = request.headers.get("x-automation-secret");
  if (direct && direct.length > 0) return direct;

  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() === "bearer" && token) {
    return token;
  }
  return null;
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const config = getServerConfigSafe();
  if (!config.success) {
    log.error("Automation followups endpoint config invalid", {
      config_error: config.error.flatten(),
    });
    return NextResponse.json({ error: "Not configured", request_id: requestId }, { status: 500 });
  }

  const secret = config.data.AUTOMATION_CRON_SECRET ?? config.data.CRON_SECRET;
  if (!secret) {
    log.warn("Automation followups endpoint disabled: secret missing");
    return NextResponse.json({ error: "Not configured", request_id: requestId }, { status: 503 });
  }

  const provided = readProvidedSecret(request);
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
  }

  try {
    const ctaUrl = `${new URL(request.url).origin}/assessment`;
    const result = await enqueueInactiveFollowupJobs({
      requestId,
      ctaUrl,
    });
    log.info("Inactive followup automation jobs enqueued", result);
    return NextResponse.json({
      ok: true,
      ...result,
      request_id: requestId,
    });
  } catch (err) {
    log.error("Inactive followup automation failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
