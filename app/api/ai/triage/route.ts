import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { getAgentSystemPrompt } from "@/lib/ai/prompts";
import { callAgent } from "@/lib/ai/openai";
import { LeadTriageOutputSchema } from "@/lib/ai/schemas";

const BodySchema = z.object({
  lead_id: z.string().uuid(),
}).strict();

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden", request_id: requestId }, { status: 403 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI service not configured", request_id: requestId },
      { status: 500 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsedBody = BodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid body", request_id: requestId }, { status: 400 });
    }

    const supabase = getServerSupabase();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, phone, package_slug, message")
      .eq("id", parsedBody.data.lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found", request_id: requestId }, { status: 404 });
    }

    const systemPrompt = await getAgentSystemPrompt("lead-triage");
    const triageRaw = await callAgent({
      agentName: "lead-triage",
      systemPrompt,
      userJson: {
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
      },
    });

    const triageParsed = LeadTriageOutputSchema.safeParse(triageRaw);
    if (!triageParsed.success) {
      log.warn("Triage schema validation failed", { issues: triageParsed.error.issues });
      return NextResponse.json(
        { error: "Invalid AI response format", request_id: requestId },
        { status: 502 },
      );
    }

    const triage = triageParsed.data;
    const { data: existingRows, error: existingError } = await supabase
      .from("lead_ai")
      .select("id")
      .eq("lead_id", parsedBody.data.lead_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingError) {
      log.error("Failed to load lead_ai row", { error: existingError.message });
      return NextResponse.json({ error: "Failed to save triage", request_id: requestId }, { status: 500 });
    }

    const existingId = existingRows?.[0]?.id as string | undefined;
    const now = new Date().toISOString();
    if (existingId) {
      const { error: updateError } = await supabase
        .from("lead_ai")
        .update({ triage_json: triage, updated_at: now })
        .eq("id", existingId);
      if (updateError) {
        log.error("Failed to update triage", { error: updateError.message });
        return NextResponse.json({ error: "Failed to save triage", request_id: requestId }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase
        .from("lead_ai")
        .insert({ lead_id: parsedBody.data.lead_id, triage_json: triage, updated_at: now });
      if (insertError) {
        log.error("Failed to insert triage", { error: insertError.message });
        return NextResponse.json({ error: "Failed to save triage", request_id: requestId }, { status: 500 });
      }
    }

    log.info("Lead triage generated", { lead_id: parsedBody.data.lead_id });
    return NextResponse.json({ triage, request_id: requestId });
  } catch (err) {
    log.error("Triage route error", { err: String(err) });
    return NextResponse.json({ error: "Server error", request_id: requestId }, { status: 500 });
  }
}
