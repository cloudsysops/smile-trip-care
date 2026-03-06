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
  success_url: z.string().max(2000).optional(),
  cancel_url: z.string().max(2000).optional(),
});

function resolveInternalReturnUrl(
  rawUrl: string | undefined,
  origin: string,
  fallbackPath: string,
): string | null {
  if (!rawUrl) {
    return `${origin}${fallbackPath}`;
  }
  try {
    const url = new URL(rawUrl, origin);
    if (url.origin !== origin) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

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
    const origin = new URL(request.url).origin;
    const successUrl = resolveInternalReturnUrl(
      success_url,
      origin,
      `/admin/leads/${lead_id}?paid=1`,
    );
    const cancelUrl = resolveInternalReturnUrl(
      cancel_url,
      origin,
      `/admin/leads/${lead_id}`,
    );
    if (!successUrl || !cancelUrl) {
      return NextResponse.json({ error: "Invalid return URLs" }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data: leadRow, error: leadError } = await supabase
      .from("leads")
      .select("id")
      .eq("id", lead_id)
      .maybeSingle();
    if (leadError) {
      log.error("Failed to validate lead before checkout", { error: leadError.message, lead_id });
      return NextResponse.json({ error: "Internal server error", request_id: requestId }, { status: 500 });
    }
    if (!leadRow) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const stripe = new Stripe(config.STRIPE_SECRET_KEY);
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
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { lead_id },
    });

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
