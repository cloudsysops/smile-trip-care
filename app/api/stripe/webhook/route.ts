import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerConfig } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { UuidSchema } from "@/lib/validation/common";
import { enqueueDepositPaidAutomationJobs } from "@/lib/ai/automation";

const CheckoutSessionMetadataSchema = z.object({
  lead_id: UuidSchema,
});

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2026-02-25.clover";
export const runtime = "nodejs";

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return candidate.code === "23505" || candidate.message?.includes("duplicate key value violates unique constraint") === true;
}

/** Stripe webhook: MUST use raw body for signature verification. */
export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  const config = getServerConfig();
  if (!config.STRIPE_SECRET_KEY || !config.STRIPE_WEBHOOK_SECRET) {
    log.error("Stripe webhook env missing");
    return NextResponse.json({ error: "Not configured", request_id: requestId }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    log.warn("Webhook missing stripe-signature");
    return NextResponse.json({ error: "Missing signature", request_id: requestId }, { status: 400 });
  }

  let payload: string;
  try {
    payload = await request.text();
  } catch {
    log.error("Failed to read raw body");
    return NextResponse.json({ error: "Bad body", request_id: requestId }, { status: 400 });
  }

  const stripe = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    log.warn("Webhook signature verification failed", { err: String(err) });
    return NextResponse.json({ error: "Invalid signature", request_id: requestId }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "payment") {
    log.info("Ignoring checkout session with unsupported mode", {
      session_id: session.id,
      mode: session.mode,
    });
    return NextResponse.json({ received: true, ignored: "unsupported_mode" });
  }
  if (session.payment_status !== "paid") {
    log.info("Ignoring checkout session with non-paid status", {
      session_id: session.id,
      payment_status: session.payment_status,
    });
    return NextResponse.json({ received: true, ignored: "payment_not_paid" });
  }
  const sessionId = session.id;
  const metadataParsed = CheckoutSessionMetadataSchema.safeParse(session.metadata ?? {});
  if (!metadataParsed.success) {
    log.warn("checkout.session.completed with invalid lead_id metadata");
  }
  const leadIdFromMetadata = metadataParsed.success ? metadataParsed.data.lead_id : null;

  const supabase = getServerSupabase();
  const { data: paymentRows, error: paymentLookupError } = await supabase
    .from("payments")
    .select("id, lead_id, status")
    .eq("stripe_checkout_session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(2);
  if (paymentLookupError) {
    log.error("Failed to lookup payment by session", {
      error: paymentLookupError.message,
      session_id: sessionId,
    });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }

  const now = new Date().toISOString();
  let paymentId: string | null = null;
  let leadIdToUpdate: string | null = leadIdFromMetadata;
  let idempotentReplay = false;

  if (!paymentRows || paymentRows.length === 0) {
    if (!leadIdFromMetadata) {
      log.warn("Webhook received for unknown session and missing lead_id metadata", {
        session_id: sessionId,
      });
      return NextResponse.json({ received: true });
    }

    log.warn("No payment row found for session; creating succeeded payment from webhook", {
      session_id: sessionId,
    });
    const { data: createdPayment, error: createPaymentError } = await supabase
      .from("payments")
      .insert({
        lead_id: leadIdFromMetadata,
        stripe_checkout_session_id: sessionId,
        amount_cents: session.amount_total ?? null,
        status: "succeeded",
        updated_at: now,
      })
      .select("id, lead_id")
      .single();
    if (createPaymentError || !createdPayment) {
      if (isUniqueViolation(createPaymentError)) {
        const { data: raceRows, error: raceLookupError } = await supabase
          .from("payments")
          .select("id, lead_id, status")
          .eq("stripe_checkout_session_id", sessionId)
          .order("created_at", { ascending: false })
          .limit(1);
        if (raceLookupError || !raceRows?.[0]) {
          log.error("Failed to recover payment after duplicate insert race", {
            error: String(raceLookupError ?? createPaymentError),
            session_id: sessionId,
          });
          return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
        }
        const recovered = raceRows[0];
        paymentId = recovered.id as string;
        if (typeof recovered.lead_id === "string" && recovered.lead_id.length > 0) {
          leadIdToUpdate = recovered.lead_id;
        }
        idempotentReplay = recovered.status === "succeeded";
      } else {
        log.error("Failed to create payment from webhook", {
          error: String(createPaymentError),
          session_id: sessionId,
        });
        return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
      }
    } else {
      paymentId = createdPayment.id as string;
      leadIdToUpdate = createdPayment.lead_id as string;
    }
  } else {
    if (paymentRows.length > 1) {
      log.warn("Multiple payments found for Stripe session; using latest row", {
        session_id: sessionId,
        count: paymentRows.length,
      });
    }
    const latestPayment = paymentRows[0];
    paymentId = latestPayment.id as string;
    if (typeof latestPayment.lead_id === "string" && latestPayment.lead_id.length > 0) {
      leadIdToUpdate = latestPayment.lead_id;
    }

    if (latestPayment.status === "succeeded") {
      idempotentReplay = true;
    } else {
      const { data: updatedPayment, error: updatePayError } = await supabase
        .from("payments")
        .update({ status: "succeeded", updated_at: now })
        .eq("id", paymentId)
        .neq("status", "succeeded")
        .select("id")
        .maybeSingle();
      if (updatePayError) {
        log.error("Failed to update payment", {
          payment_id: paymentId,
          error: String(updatePayError),
        });
        return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
      }
      if (!updatedPayment) {
        idempotentReplay = true;
      }
    }
  }

  if (leadIdFromMetadata && leadIdToUpdate !== leadIdFromMetadata) {
    log.warn("Lead id mismatch between metadata and payment row", {
      metadata_lead_id: leadIdFromMetadata,
      payment_lead_id: leadIdToUpdate,
      payment_id: paymentId,
    });
  }

  if (leadIdToUpdate) {
    const { error: leadError } = await supabase
      .from("leads")
      .update({ status: "deposit_paid", updated_at: now })
      .eq("id", leadIdToUpdate)
      .neq("status", "deposit_paid");
    if (leadError) {
      log.error("Failed to update lead status", { error: leadError.message });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }
    void enqueueDepositPaidAutomationJobs(leadIdToUpdate)
      .then((jobs) => {
        log.info("Automation jobs enqueued", {
          lead_id: leadIdToUpdate,
          trigger_type: "lead_deposit_paid",
          job_count: jobs.length,
        });
      })
      .catch((err) => {
        log.error("Deposit-paid automation enqueue failed", {
          lead_id: leadIdToUpdate,
          trigger_type: "lead_deposit_paid",
          error: err instanceof Error ? err.message : String(err),
        });
      });
  } else {
    log.warn("No lead id available for succeeded payment", {
      payment_id: paymentId,
      session_id: sessionId,
    });
  }

  log.info("Webhook processed: payment succeeded, lead deposit_paid", {
    lead_id: leadIdToUpdate,
    payment_id: paymentId,
    idempotent_replay: idempotentReplay,
  });
  return NextResponse.json({ received: true, ...(idempotentReplay ? { idempotent: true } : {}) });
}
