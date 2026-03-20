import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerConfigSafe } from "@/lib/config/server";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";
import { enqueueDepositPaidAutomationJobs } from "@/lib/ai/automation";
import { resolvePaymentFromCheckoutSession } from "@/lib/payments/reliability";
import { timingSafeSecretCompare } from "@/lib/security/secret";

export const runtime = "nodejs";

type PendingPaymentRow = {
  id: string;
  lead_id: string;
  stripe_checkout_session_id: string | null;
  created_at: string;
  updated_at: string;
};

function readProvidedSecret(request: Request): string | null {
  const direct = request.headers.get("x-automation-secret");
  if (direct && direct.length > 0) return direct;

  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() === "bearer" && token) return token;
  return null;
}

function normalizeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getLimitFromRequest(request: Request): number {
  const url = new URL(request.url);
  const raw = Number(url.searchParams.get("limit") ?? "50");
  if (!Number.isFinite(raw) || raw <= 0) return 50;
  return Math.min(Math.floor(raw), 200);
}

function getStaleMinutesFromRequest(request: Request): number {
  const url = new URL(request.url);
  const raw = Number(url.searchParams.get("stale_minutes") ?? "15");
  if (!Number.isFinite(raw) || raw <= 0) return 15;
  return Math.min(Math.floor(raw), 24 * 60);
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const config = getServerConfigSafe();
  if (!config.success) {
    log.error("Payment reconcile endpoint config invalid", {
      config_error: config.error.flatten(),
    });
    return NextResponse.json({ error: "Not configured", request_id: requestId }, { status: 500 });
  }

  const secret = config.data.AUTOMATION_CRON_SECRET ?? config.data.CRON_SECRET;
  if (!secret || !config.data.STRIPE_SECRET_KEY) {
    log.warn("Payment reconcile endpoint disabled: missing cron secret or Stripe key");
    return NextResponse.json({ error: "Not configured", request_id: requestId }, { status: 503 });
  }

  const provided = readProvidedSecret(request);
  if (!timingSafeSecretCompare(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized", request_id: requestId }, { status: 401 });
  }

  const limit = getLimitFromRequest(request);
  const staleMinutes = getStaleMinutesFromRequest(request);
  const staleBeforeIso = new Date(Date.now() - staleMinutes * 60_000).toISOString();

  const stripe = new Stripe(config.data.STRIPE_SECRET_KEY);
  const supabase = getServerSupabase();

  const { data: rows, error: lookupError } = await supabase
    .from("payments")
    .select("id, lead_id, stripe_checkout_session_id, created_at, updated_at")
    .eq("status", "pending")
    .not("stripe_checkout_session_id", "is", null)
    .lte("updated_at", staleBeforeIso)
    .order("updated_at", { ascending: true })
    .limit(limit);
  if (lookupError) {
    log.error("Failed to load pending payments for reconciliation", { error: lookupError.message });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }

  const result = {
    scanned: 0,
    recovered_succeeded: 0,
    marked_failed: 0,
    still_pending: 0,
    skipped: 0,
    errors: 0,
    stale_before: staleBeforeIso,
  };

  for (const row of (rows ?? []) as PendingPaymentRow[]) {
    result.scanned += 1;
    if (!row.stripe_checkout_session_id) {
      result.skipped += 1;
      continue;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(row.stripe_checkout_session_id);
      const target = resolvePaymentFromCheckoutSession(session);
      if (target === "pending") {
        result.still_pending += 1;
        continue;
      }

      const nowIso = new Date().toISOString();
      if (target === "failed") {
        const { data: updated, error: updateError } = await supabase
          .from("payments")
          .update({
            status: "failed",
            stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
            updated_at: nowIso,
          })
          .eq("id", row.id)
          .eq("status", "pending")
          .select("id")
          .maybeSingle();
        if (updateError) {
          throw new Error(`Failed to mark pending payment failed: ${updateError.message}`);
        }
        if (updated) {
          result.marked_failed += 1;
        } else {
          result.skipped += 1;
        }
        continue;
      }

      const { data: updated, error: updateError } = await supabase
        .from("payments")
        .update({
          status: "succeeded",
          stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
          updated_at: nowIso,
        })
        .eq("id", row.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (updateError) {
        throw new Error(`Failed to mark pending payment succeeded: ${updateError.message}`);
      }
      if (!updated) {
        result.skipped += 1;
        continue;
      }

      const { error: leadError } = await supabase
        .from("leads")
        .update({ status: "deposit_paid", updated_at: nowIso })
        .eq("id", row.lead_id)
        .neq("status", "deposit_paid");
      if (leadError) {
        throw new Error(`Failed to update lead status after payment recovery: ${leadError.message}`);
      }
      result.recovered_succeeded += 1;

      void enqueueDepositPaidAutomationJobs(row.lead_id)
        .then((jobs) => {
          log.info("Reconcile enqueued deposit-paid jobs", {
            lead_id: row.lead_id,
            payment_id: row.id,
            jobs: jobs.length,
          });
        })
        .catch((err) => {
          log.error("Reconcile failed to enqueue deposit-paid jobs", {
            lead_id: row.lead_id,
            payment_id: row.id,
            error: normalizeError(err),
          });
        });
    } catch (error) {
      result.errors += 1;
      log.error("Payment reconciliation row failed", {
        payment_id: row.id,
        lead_id: row.lead_id,
        session_id: row.stripe_checkout_session_id,
        error: normalizeError(error),
      });
    }
  }

  log.info("Payment reconciliation run completed", {
    ...result,
    limit,
    stale_minutes: staleMinutes,
  });
  return NextResponse.json({
    ok: true,
    ...result,
    limit,
    stale_minutes: staleMinutes,
    request_id: requestId,
  });
}
