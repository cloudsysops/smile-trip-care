import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { runAgent } from "@/lib/ai/run-agent";
import { saveLeadAI } from "@/lib/ai/persist";
import { LeadTriageOutputSchema } from "@/lib/ai/schemas";
import type { SalesResponderOutput } from "@/lib/ai/schemas";

const BodySchema = z
  .object({
    lead_id: z.string().uuid(),
    cta_url: z.string().url().optional(),
  })
  .strict();

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

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI service not configured", request_id: requestId },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", request_id: requestId }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, phone, country, package_slug, message")
      .eq("id", parsed.data.lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found", request_id: requestId }, { status: 404 });
    }

    const { data: aiRows } = await supabase
      .from("lead_ai")
      .select("triage_json")
      .eq("lead_id", parsed.data.lead_id)
      .order("created_at", { ascending: false })
      .limit(1);
    const triageMaybe = LeadTriageOutputSchema.safeParse(aiRows?.[0]?.triage_json);

    const ctaUrl = parsed.data.cta_url ?? `${new URL(request.url).origin}/assessment`;
    const input = {
      lead: {
        name: `${lead.first_name} ${lead.last_name}`.trim(),
        email: lead.email,
        phone: lead.phone,
        country: lead.country,
        package_slug: lead.package_slug,
        notes: lead.message,
      },
      triage: triageMaybe.success ? triageMaybe.data : null,
      cta_url: ctaUrl,
    };

    const result = await runAgent<SalesResponderOutput>("sales-responder", input, { requestId });
    const payload = {
      ...result.output,
      generated_at: new Date().toISOString(),
      lead_snapshot_minimal: {
        lead_id: lead.id,
        name: `${lead.first_name} ${lead.last_name}`.trim(),
        email: lead.email,
        country: (lead.country as string | null) ?? null,
        package_slug: (lead.package_slug as string | null) ?? null,
      },
    };
    await saveLeadAI(parsed.data.lead_id, "sales", payload as unknown as Record<string, unknown>);

    log.info("Lead response generated", { lead_id: parsed.data.lead_id });
    return NextResponse.json({ reply: payload, request_id: requestId });
  } catch (err) {
    log.error("Respond route error", { err: String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error", request_id: requestId },
      { status: 502 }
    );
  }
}
