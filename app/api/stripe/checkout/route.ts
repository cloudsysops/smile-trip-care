import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerConfig } from "@/lib/config/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { z } from "zod";
import { UuidSchema } from "@/lib/validation/common";

const BodySchema = z.object({
  lead_id: UuidSchema,
  amount_cents: z.number().int().positive().max(10_000_000),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }
  try {
    const config = getServerConfig();
    if (!config.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured", request_id: requestId }, { status: 500 });
    }
    const body = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", request_id: requestId }, { status: 400 });
    }
    const { lead_id, amount_cents, success_url, cancel_url } = parsed.data;

    const stripe = new Stripe(config.STRIPE_SECRET_KEY);
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount_cents,
            product_data: { name: "Deposit — Smile Transformation" },
          },
        },
      ],
      success_url: success_url || `${origin}/admin/leads/${lead_id}?paid=1`,
      cancel_url: cancel_url || `${origin}/admin/leads/${lead_id}`,
      metadata: { lead_id },
    });

    const supabase = getServerSupabase();
    const { error } = await supabase.from("payments").insert({
      lead_id,
      stripe_checkout_session_id: session.id,
      amount_cents,
      status: "pending",
    });
    if (error) {
      log.error("Failed to persist checkout session", { error: error.message, lead_id });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }

    return NextResponse.json({ url: session.url, request_id: requestId });
  } catch (err) {
    log.error("Stripe checkout endpoint failed", { err: String(err) });
    return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
  }
}
