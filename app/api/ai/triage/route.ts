import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { getAgentSystemPrompt } from "@/lib/ai/prompts";
import { callAgent } from "@/lib/ai/openai";
import { LeadTriageOutputSchema } from "@/lib/ai/schemas";
import { jsonBadRequest, jsonError, jsonForbidden, jsonInternalServerError } from "@/lib/http/response";

const BodySchema = z.object({
  lead_id: z.string().uuid(),
}).strict();

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);
  let adminUserId = "";

  try {
    const { user } = await requireAdmin();
    adminUserId = user.id;
  } catch {
    return jsonForbidden(requestId);
  }

  if (!process.env.OPENAI_API_KEY) {
    return jsonInternalServerError(requestId);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsedBody = BodySchema.safeParse(body);
    if (!parsedBody.success) {
      return jsonBadRequest("Invalid body", requestId);
    }

    const supabase = getServerSupabase();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, phone, package_slug, message")
      .eq("id", parsedBody.data.lead_id)
      .single();

    if (leadError || !lead) {
      return jsonError(404, "Lead not found", requestId);
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
      return jsonError(502, "Invalid AI response format", requestId);
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
      return jsonInternalServerError(requestId);
    }

    const existingId = existingRows?.[0]?.id as string | undefined;
    const now = new Date().toISOString();
    if (existingId) {
      const { error: updateError } = await supabase
        .from("lead_ai")
        .update({ triage_json: triage, triage_completed: true, updated_at: now })
        .eq("id", existingId);
      if (updateError) {
        log.error("Failed to update triage", { error: updateError.message });
        return jsonInternalServerError(requestId);
      }
    } else {
      const { error: insertError } = await supabase
        .from("lead_ai")
        .insert({
          lead_id: parsedBody.data.lead_id,
          triage_json: triage,
          triage_completed: true,
          updated_at: now,
        });
      if (insertError) {
        log.error("Failed to insert triage", { error: insertError.message });
        return jsonInternalServerError(requestId);
      }
    }

    log.info("Lead triage generated", { lead_id: parsedBody.data.lead_id, admin_user_id: adminUserId });
    return NextResponse.json({ triage, request_id: requestId });
  } catch (err) {
    log.error("Triage route error", { err: String(err) });
    return jsonInternalServerError(requestId);
  }
}
