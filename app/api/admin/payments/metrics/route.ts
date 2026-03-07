import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";

type PaymentRow = {
  id: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  created_at: string;
  updated_at: string;
};

type StripeWebhookEventRow = {
  status: "received" | "processed" | "ignored" | "failed";
  event_type: string;
  received_at: string;
};

function parseTs(value: string): number | null {
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? null : ts;
}

export async function GET() {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }

  const supabase = getServerSupabase();
  const { data: paymentsRaw, error: paymentsError } = await supabase
    .from("payments")
    .select("id, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(2000);
  if (paymentsError) {
    log.error("Failed to load payments metrics", { error: paymentsError.message });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }

  const { data: webhookRaw, error: webhookError } = await supabase
    .from("stripe_webhook_events")
    .select("status, event_type, received_at")
    .order("received_at", { ascending: false })
    .limit(2000);
  if (webhookError) {
    log.warn("Failed to load stripe webhook metrics (non-fatal)", { error: webhookError.message });
  }

  const payments = (paymentsRaw ?? []) as PaymentRow[];
  const webhookEvents = (webhookRaw ?? []) as StripeWebhookEventRow[];
  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const age15m = 15 * 60 * 1000;
  const age60m = 60 * 60 * 1000;

  let pendingCount = 0;
  let pendingOver15m = 0;
  let pendingOver60m = 0;
  let pendingOver24h = 0;
  let succeeded24h = 0;
  let failed24h = 0;
  let recoveredEstimated24h = 0;

  for (const payment of payments) {
    const createdTs = parseTs(payment.created_at);
    const updatedTs = parseTs(payment.updated_at);
    if (payment.status === "pending") {
      pendingCount += 1;
      const ageBase = updatedTs ?? createdTs;
      if (ageBase !== null) {
        const ageMs = now - ageBase;
        if (ageMs >= age15m) pendingOver15m += 1;
        if (ageMs >= age60m) pendingOver60m += 1;
        if (ageMs >= 24 * 60 * 60 * 1000) pendingOver24h += 1;
      }
      continue;
    }

    if (payment.status === "succeeded" && updatedTs !== null && updatedTs >= last24h) {
      succeeded24h += 1;
      if (createdTs !== null && updatedTs - createdTs >= age15m) {
        recoveredEstimated24h += 1;
      }
      continue;
    }

    if (payment.status === "failed" && updatedTs !== null && updatedTs >= last24h) {
      failed24h += 1;
    }
  }

  const webhookLast24h = webhookEvents.filter((event) => {
    const ts = parseTs(event.received_at);
    return ts !== null && ts >= last24h;
  });
  const webhookProcessed24h = webhookLast24h.filter((event) => event.status === "processed").length;
  const webhookFailed24h = webhookLast24h.filter((event) => event.status === "failed").length;
  const webhookIgnored24h = webhookLast24h.filter((event) => event.status === "ignored").length;

  return NextResponse.json({
    metrics: {
      total_payments_sampled: payments.length,
      pending_count: pendingCount,
      pending_over_15m: pendingOver15m,
      pending_over_60m: pendingOver60m,
      pending_over_24h: pendingOver24h,
      succeeded_last_24h: succeeded24h,
      failed_last_24h: failed24h,
      recovered_estimated_last_24h: recoveredEstimated24h,
      webhook_events_last_24h: webhookLast24h.length,
      webhook_processed_last_24h: webhookProcessed24h,
      webhook_failed_last_24h: webhookFailed24h,
      webhook_ignored_last_24h: webhookIgnored24h,
    },
    request_id: requestId,
  });
}
