import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateLeadCopilot, getLeadCopilotFallback } from "@/lib/ai/lead-copilot";
import type { LeadCopilotInput } from "@/lib/ai/lead-copilot";

const BodySchema = z.object({ lead_id: z.string().uuid() }).strict();

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  try {
    const { user } = await requireAdmin();
    if (!checkRateLimit(`admin-ai:${user.id}`)) {
      return NextResponse.json({ error: "Too many requests", request_id: requestId }, { status: 429 });
    }
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    return NextResponse.json({ error: "Invalid body", request_id: requestId }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", request_id: requestId }, { status: 400 });
  }

  const supabase = getServerSupabase();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, phone, country, package_slug, message, selected_specialties, travel_companions, budget_range")
    .eq("id", parsed.data.lead_id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found", request_id: requestId }, { status: 404 });
  }

  const input: LeadCopilotInput = {
    first_name: (lead.first_name as string) ?? "",
    last_name: (lead.last_name as string) ?? "",
    email: (lead.email as string) ?? "",
    phone: (lead.phone as string | null) ?? null,
    country: (lead.country as string | null) ?? null,
    package_slug: (lead.package_slug as string | null) ?? null,
    message: (lead.message as string | null) ?? null,
    selected_specialties: Array.isArray(lead.selected_specialties) ? lead.selected_specialties : null,
    travel_companions: (lead.travel_companions as string | null) ?? null,
    budget_range: (lead.budget_range as string | null) ?? null,
  };

  const fallback = getLeadCopilotFallback(input);

  if (!process.env.OPENAI_API_KEY) {
    log.info("Copilot: no OPENAI_API_KEY, returning fallback", { lead_id: parsed.data.lead_id });
    return NextResponse.json({
      copilot: fallback,
      from_fallback: true,
      request_id: requestId,
    });
  }

  const result = await generateLeadCopilot(input);
  if (result) {
    log.info("Lead copilot generated", { lead_id: parsed.data.lead_id });
    return NextResponse.json({
      copilot: result,
      from_fallback: false,
      request_id: requestId,
    });
  }

  log.warn("Lead copilot failed, returning fallback", { lead_id: parsed.data.lead_id });
  return NextResponse.json({
    copilot: fallback,
    from_fallback: true,
    request_id: requestId,
  });
}
