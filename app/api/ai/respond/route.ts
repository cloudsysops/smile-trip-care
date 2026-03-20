import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { callSalesResponder } from "@/lib/ai/openai";
import { LeadTriageOutputSchema } from "@/lib/ai/schemas";

const BodySchema = z.object({
  lead_id: z.string().uuid(),
  cta_url: z.string().url().optional(),
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
      .select("id, first_name, last_name, email, phone, country, package_slug, message")
      .eq("id", parsedBody.data.lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found", request_id: requestId }, { status: 404 });
    }

    const { data: aiRows, error: aiError } = await supabase
      .from("lead_ai")
      .select("id, triage_json")
      .eq("lead_id", parsedBody.data.lead_id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (aiError) {
      log.error("Failed to load lead_ai row", { error: aiError.message });
      return NextResponse.json({ error: "Failed to generate reply", request_id: requestId }, { status: 500 });
    }
    const aiRow = aiRows?.[0];
    const triageMaybe = LeadTriageOutputSchema.safeParse(aiRow?.triage_json);

    const ctaUrl = parsedBody.data.cta_url ?? `${new URL(request.url).origin}/assessment`;
    const reply = await callSalesResponder({
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
    });

    const generatedAt = new Date().toISOString();
    const messagePayload = {
      ...reply,
      generated_at: generatedAt,
      lead_snapshot_minimal: {
        lead_id: lead.id as string,
        name: `${lead.first_name} ${lead.last_name}`.trim(),
        email: lead.email as string,
        country: (lead.country as string | null) ?? null,
        package_slug: (lead.package_slug as string | null) ?? null,
      },
    };

    const now = new Date().toISOString();
    const existingId = aiRow?.id as string | undefined;
    if (existingId) {
      const { error: updateError } = await supabase
        .from("lead_ai")
        .update({ messages_json: messagePayload, response_generated: true, updated_at: now })
        .eq("id", existingId);
      if (updateError) {
        log.error("Failed to update messages_json", { error: updateError.message });
        return NextResponse.json({ error: "Failed to save reply", request_id: requestId }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase
        .from("lead_ai")
        .insert({
          lead_id: parsedBody.data.lead_id,
          messages_json: messagePayload,
          response_generated: true,
          updated_at: now,
        });
      if (insertError) {
        log.error("Failed to insert messages_json", { error: insertError.message });
        return NextResponse.json({ error: "Failed to save reply", request_id: requestId }, { status: 500 });
      }
    }

    log.info("Lead response generated", { lead_id: parsedBody.data.lead_id });
    return NextResponse.json({ reply: messagePayload, request_id: requestId });
  } catch (err) {
    log.error("Respond route error", { err: String(err) });
    return NextResponse.json({ error: "Server error", request_id: requestId }, { status: 500 });
  }
}
