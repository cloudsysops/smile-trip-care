import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerConfig } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { UuidSchema } from "@/lib/validation/common";
import { enqueueDepositPaidAutomationJobs } from "@/lib/ai/automation";
import {
  isHandledStripeWebhookType,
  resolvePaymentFromWebhookEvent,
} from "@/lib/payments/reliability";

const CheckoutSessionMetadataSchema = z.object({
  lead_id: UuidSchema,
});

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2026-02-25.clover";
export const runtime = "nodejs";

type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

type PaymentLookupRow = {
  id: string;
  lead_id: string | null;
  status: PaymentStatus;
};

function normalizeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function truncateError(error: string): string {
  return error.length > 800 ? error.slice(0, 800) : error;
}

function nextPaymentStatus(current: PaymentStatus, target: "pending" | "succeeded" | "failed"): PaymentStatus | null {
  if (target === "succeeded") {
    return current === "succeeded" ? null : "succeeded";
  }
  if (target === "failed") {
    if (current === "succeeded" || current === "refunded" || current === "failed") return null;
    return "failed";
  }
  return null;
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

  if (!isHandledStripeWebhookType(event.type)) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const targetStatus = resolvePaymentFromWebhookEvent(event.type, session);
  const sessionId = session.id;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
  const metadataParsed = CheckoutSessionMetadataSchema.safeParse(session.metadata ?? {});
  if (!metadataParsed.success) {
    log.warn("checkout.session.completed with invalid lead_id metadata");
  }
  const leadIdFromMetadata = metadataParsed.success ? metadataParsed.data.lead_id : null;

  const supabase = getServerSupabase();
  const now = new Date().toISOString();
  const { data: eventRows, error: eventInsertError } = await supabase
    .from("stripe_webhook_events")
    .upsert({
      stripe_event_id: event.id,
      event_type: event.type,
      stripe_api_version: event.api_version ?? null,
      livemode: event.livemode ?? false,
      status: "received",
      payload_json: event as unknown as Record<string, unknown>,
      received_at: now,
      updated_at: now,
    }, {
      onConflict: "stripe_event_id",
      ignoreDuplicates: true,
    })
    .select("id")
    .limit(1);
  if (eventInsertError) {
    log.error("Failed to persist webhook event", {
      event_id: event.id,
      error: eventInsertError.message,
    });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
  if (!eventRows || eventRows.length === 0) {
    log.info("Webhook replay ignored by event dedupe", {
      event_id: event.id,
      event_type: event.type,
    });
    return NextResponse.json({ received: true, idempotent: true });
  }

  const eventRowId = eventRows[0].id as string;
  let paymentId: string | null = null;
  let leadIdToUpdate: string | null = leadIdFromMetadata;
  let idempotentReplay = false;

  try {
    const { data: paymentRows, error: paymentLookupError } = await supabase
      .from("payments")
      .select("id, lead_id, status")
      .eq("stripe_checkout_session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(2);
    if (paymentLookupError) {
      throw new Error(`Failed to lookup payment by session: ${paymentLookupError.message}`);
    }

    if (!paymentRows || paymentRows.length === 0) {
      if (!leadIdFromMetadata) {
        const warnMessage = "Webhook session not found in payments and lead metadata missing";
        log.warn(warnMessage, { session_id: sessionId, event_id: event.id });
        await supabase
          .from("stripe_webhook_events")
          .update({
            status: "ignored",
            error_message: warnMessage,
            processed_at: now,
            updated_at: now,
          })
          .eq("id", eventRowId);
        return NextResponse.json({ received: true });
      }

      const createdStatus = targetStatus === "failed" ? "failed" : targetStatus === "succeeded" ? "succeeded" : "pending";
      const { data: createdPayment, error: createPaymentError } = await supabase
        .from("payments")
        .insert({
          lead_id: leadIdFromMetadata,
          stripe_checkout_session_id: sessionId,
          stripe_payment_intent_id: paymentIntentId,
          amount_cents: session.amount_total ?? null,
          status: createdStatus,
          updated_at: now,
        })
        .select("id, lead_id")
        .single();
      if (createPaymentError || !createdPayment) {
        throw new Error(`Failed to create payment from webhook: ${String(createPaymentError)}`);
      }
      paymentId = createdPayment.id as string;
      leadIdToUpdate = createdPayment.lead_id as string;
    } else {
      if (paymentRows.length > 1) {
        log.warn("Multiple payments found for Stripe session; using latest row", {
          session_id: sessionId,
          count: paymentRows.length,
          event_id: event.id,
        });
      }
      const latestPayment = paymentRows[0] as PaymentLookupRow;
      paymentId = latestPayment.id;
      if (typeof latestPayment.lead_id === "string" && latestPayment.lead_id.length > 0) {
        leadIdToUpdate = latestPayment.lead_id;
      }

      const nextStatus = nextPaymentStatus(latestPayment.status, targetStatus);
      if (!nextStatus) {
        idempotentReplay = true;
      } else {
        const { data: updatedPayment, error: updatePayError } = await supabase
          .from("payments")
          .update({
            status: nextStatus,
            stripe_payment_intent_id: paymentIntentId,
            updated_at: now,
          })
          .eq("id", paymentId)
          .eq("status", latestPayment.status)
          .select("id")
          .maybeSingle();
        if (updatePayError) {
          throw new Error(`Failed to update payment: ${String(updatePayError)}`);
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
        event_id: event.id,
      });
    }

    if (targetStatus === "succeeded") {
      if (leadIdToUpdate) {
        const { error: leadError } = await supabase
          .from("leads")
          .update({ status: "deposit_paid", updated_at: now })
          .eq("id", leadIdToUpdate)
          .neq("status", "deposit_paid");
        if (leadError) {
          throw new Error(`Failed to update lead status: ${leadError.message}`);
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
              error: normalizeError(err),
            });
          });
      } else {
        log.warn("No lead id available for succeeded payment", {
          payment_id: paymentId,
          session_id: sessionId,
          event_id: event.id,
        });
      }
    }

    await supabase
      .from("stripe_webhook_events")
      .update({
        status: "processed",
        payment_id: paymentId,
        lead_id: leadIdToUpdate,
        processed_at: now,
        updated_at: now,
      })
      .eq("id", eventRowId);

    log.info("Stripe webhook processed", {
      event_id: event.id,
      event_type: event.type,
      target_status: targetStatus,
      lead_id: leadIdToUpdate,
      payment_id: paymentId,
      idempotent_replay: idempotentReplay,
    });
    return NextResponse.json({ received: true, ...(idempotentReplay ? { idempotent: true } : {}) });
  } catch (error) {
    const message = truncateError(normalizeError(error));
    await supabase
      .from("stripe_webhook_events")
      .update({
        status: "failed",
        error_message: message,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventRowId);
    log.error("Stripe webhook processing failed", {
      event_id: event.id,
      event_type: event.type,
      session_id: sessionId,
      error: message,
    });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
