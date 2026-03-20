import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { getAgentSystemPrompt } from "@/lib/ai/prompts";
import { callAgent } from "@/lib/ai/openai";
import { LeadTriageOutputSchema } from "@/lib/ai/schemas";
import { jsonBadRequest, jsonError, jsonForbidden, jsonInternalServerError } from "@/lib/http/response";
import { getLeadForTriage, saveLeadAiTriage } from "@/lib/services/ai/lead-ai-records.service";

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

    const lead = await getLeadForTriage(parsedBody.data.lead_id);
    if (!lead) {
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
    await saveLeadAiTriage(parsedBody.data.lead_id, triage);

    log.info("Lead triage generated", { lead_id: parsedBody.data.lead_id, admin_user_id: adminUserId });
    return NextResponse.json({ triage, request_id: requestId });
  } catch (err) {
    log.error("Triage route error", { err: String(err) });
    return jsonInternalServerError(requestId);
  }
}
