import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { runAgent } from "@/lib/ai/run-agent";
import { saveLeadAI } from "@/lib/ai/persist";
import type { LeadTriageOutput } from "@/lib/ai/schemas";

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
      .select("id, first_name, last_name, email, phone, package_slug, message")
      .eq("id", parsed.data.lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found", request_id: requestId }, { status: 404 });
    }

    const input = {
      name: `${lead.first_name} ${lead.last_name}`.trim(),
      email: lead.email,
      phone: lead.phone,
      preferred_city:
        lead.package_slug === "smile-manizales"
          ? "Manizales"
          : lead.package_slug === "smile-medellin"
            ? "Medellín"
            : null,
      desired_dates: null,
      notes: lead.message,
      package_slug: lead.package_slug,
    };

    const result = await runAgent<LeadTriageOutput>("lead-triage", input, { requestId });
    await saveLeadAI(parsed.data.lead_id, "triage", result.output as unknown as Record<string, unknown>);

    log.info("Lead triage generated", { lead_id: parsed.data.lead_id });
    return NextResponse.json({ triage: result.output, request_id: requestId });
  } catch (err) {
    log.error("Triage route error", { err: String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error", request_id: requestId },
      { status: 502 }
    );
  }
}
