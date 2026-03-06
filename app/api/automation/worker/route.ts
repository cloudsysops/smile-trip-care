import { NextResponse } from "next/server";
import { getServerConfigSafe } from "@/lib/config/server";
import { createLogger } from "@/lib/logger";
import {
  claimDueAutomationJobs,
  markAutomationJobCompleted,
  markAutomationJobDeadLetter,
  retryBackoffMs,
  scheduleAutomationJobRetry,
} from "@/lib/automation/queue";
import { executeAutomationJob } from "@/lib/ai/automation";

export const runtime = "nodejs";

function readProvidedSecret(request: Request): string | null {
  const direct = request.headers.get("x-automation-secret");
  if (direct && direct.length > 0) return direct;

  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() === "bearer" && token) return token;
  return null;
}

function getLimitFromRequest(request: Request): number {
  const url = new URL(request.url);
  const raw = Number(url.searchParams.get("limit") ?? "10");
  if (!Number.isFinite(raw) || raw <= 0) return 10;
  return Math.min(Math.floor(raw), 50);
}

function normalizeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const config = getServerConfigSafe();
  if (!config.success) {
    log.error("Automation worker endpoint config invalid", {
      config_error: config.error.flatten(),
    });
    return NextResponse.json({ error: "Not configured", request_id: requestId }, { status: 500 });
  }

  const secret = config.data.AUTOMATION_CRON_SECRET ?? config.data.CRON_SECRET;
  if (!secret) {
    log.warn("Automation worker endpoint disabled: secret missing");
    return NextResponse.json({ error: "Not configured", request_id: requestId }, { status: 503 });
  }
  const provided = readProvidedSecret(request);
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
  }

  const limit = getLimitFromRequest(request);
  const workerId = `${process.env.VERCEL_REGION ?? "local"}:${requestId}`;
  try {
    const claimed = await claimDueAutomationJobs(workerId, limit);
    const result = {
      claimed: claimed.length,
      completed: 0,
      retried: 0,
      dead_letter: 0,
    };

    for (const job of claimed) {
      log.info("Automation job execution started", {
        job_id: job.id,
        lead_id: job.lead_id,
        trigger_type: job.trigger_type,
        job_type: job.job_type,
        attempts: job.attempts,
        max_attempts: job.max_attempts,
      });
      try {
        await executeAutomationJob(job, { requestId });
        await markAutomationJobCompleted(job.id);
        result.completed += 1;
        log.info("Automation job execution success", {
          job_id: job.id,
          lead_id: job.lead_id,
          trigger_type: job.trigger_type,
          job_type: job.job_type,
        });
      } catch (error) {
        const errorMessage = normalizeError(error);
        if (job.attempts >= job.max_attempts) {
          await markAutomationJobDeadLetter(job.id, errorMessage);
          result.dead_letter += 1;
          log.error("Automation job marked dead_letter", {
            job_id: job.id,
            lead_id: job.lead_id,
            trigger_type: job.trigger_type,
            job_type: job.job_type,
            attempts: job.attempts,
            max_attempts: job.max_attempts,
            error: errorMessage,
          });
        } else {
          const runAfter = new Date(Date.now() + retryBackoffMs(job.attempts)).toISOString();
          await scheduleAutomationJobRetry(job.id, runAfter, errorMessage);
          result.retried += 1;
          log.warn("Automation job retry scheduled", {
            job_id: job.id,
            lead_id: job.lead_id,
            trigger_type: job.trigger_type,
            job_type: job.job_type,
            attempts: job.attempts,
            max_attempts: job.max_attempts,
            run_after: runAfter,
            error: errorMessage,
          });
        }
      }
    }

    return NextResponse.json({ ok: true, ...result, request_id: requestId });
  } catch (error) {
    log.error("Automation worker execution failed", { error: normalizeError(error) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
