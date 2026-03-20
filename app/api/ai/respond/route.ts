import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createLogger } from "@/lib/logger";
import { callSalesResponder } from "@/lib/ai/openai";
import { LeadTriageOutputSchema } from "@/lib/ai/schemas";
import { jsonBadRequest, jsonError, jsonForbidden, jsonInternalServerError } from "@/lib/http/response";
import { getLatestLeadAiRow, getLeadForResponder, saveLeadAiMessage } from "@/lib/services/ai/lead-ai-records.service";

const BodySchema = z.object({
  lead_id: z.string().uuid(),
  cta_url: z.string().url().optional(),
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

    const lead = await getLeadForResponder(parsedBody.data.lead_id);
    if (!lead) {
      return jsonError(404, "Lead not found", requestId);
    }

    const aiRow = await getLatestLeadAiRow(parsedBody.data.lead_id);
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

    await saveLeadAiMessage(parsedBody.data.lead_id, messagePayload);

    log.info("Lead response generated", { lead_id: parsedBody.data.lead_id, admin_user_id: adminUserId });
    return NextResponse.json({ reply: messagePayload, request_id: requestId });
  } catch (err) {
    log.error("Respond route error", { err: String(err) });
    return jsonInternalServerError(requestId);
  }
}
