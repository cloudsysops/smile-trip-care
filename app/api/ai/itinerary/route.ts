import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { getAgentSystemPrompt } from "@/lib/ai/prompts";
import { callAgent } from "@/lib/ai/openai";
import { ItineraryOutputSchema, LeadTriageOutputSchema } from "@/lib/ai/schemas";

const BodySchema = z.object({
  lead_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days: z.coerce.number().int().min(2).max(14).optional(),
  includes_tour: z.boolean().optional(),
}).strict();

function inferCityFromLead(packageSlug: string | null | undefined): "Medellín" | "Manizales" | null {
  if (packageSlug === "smile-manizales") return "Manizales";
  if (packageSlug === "smile-medellin") return "Medellín";
  return null;
}

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

    const { lead_id, start_date, includes_tour } = parsedBody.data;
    const days = parsedBody.data.days ?? 5;

    const supabase = getServerSupabase();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, country, package_slug, message")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found", request_id: requestId }, { status: 404 });
    }

    const { data: aiRows, error: aiError } = await supabase
      .from("lead_ai")
      .select("triage_json")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (aiError) {
      log.error("Failed to load lead_ai triage", { error: aiError.message });
    }
    const triageMaybe = LeadTriageOutputSchema.safeParse(aiRows?.[0]?.triage_json);
    const inferredCity =
      inferCityFromLead(lead.package_slug) ??
      (triageMaybe.success ? triageMaybe.data.recommended_city : null) ??
      "Medellín";

    let packageId: string | null = null;
    if (lead.package_slug) {
      const { data: packageRow } = await supabase
        .from("packages")
        .select("id")
        .eq("slug", lead.package_slug)
        .maybeSingle();
      packageId = (packageRow?.id as string | undefined) ?? null;
    }

    const systemPrompt = await getAgentSystemPrompt("itinerary-generator");
    const itineraryRaw = await callAgent({
      agentName: "itinerary-generator",
      systemPrompt,
      userJson: {
        lead: {
          name: `${lead.first_name} ${lead.last_name}`.trim(),
          country: lead.country,
          package_slug: lead.package_slug,
          notes: lead.message,
        },
        city: inferredCity,
        start_date: start_date ?? null,
        days,
        includes_tour: includes_tour ?? false,
      },
    });

    const itineraryParsed = ItineraryOutputSchema.safeParse(itineraryRaw);
    if (!itineraryParsed.success) {
      log.warn("Itinerary schema validation failed", { issues: itineraryParsed.error.issues });
      return NextResponse.json(
        { error: "Invalid AI response format", request_id: requestId },
        { status: 502 },
      );
    }

    const itinerary = itineraryParsed.data;
    const { data: created, error: insertError } = await supabase
      .from("itineraries")
      .insert({
        lead_id,
        package_id: packageId,
        city: itinerary.city,
        content_json: itinerary,
        day_index: 1,
        title: "AI itinerary",
        description: itinerary.whatsapp_summary,
        updated_at: new Date().toISOString(),
      })
      .select("id, city, content_json, created_at")
      .single();

    if (insertError) {
      log.error("Failed to insert itinerary", { error: insertError.message });
      return NextResponse.json({ error: "Failed to save itinerary", request_id: requestId }, { status: 500 });
    }

    log.info("Itinerary generated", { lead_id });
    return NextResponse.json({ itinerary: created?.content_json ?? itinerary, request_id: requestId });
  } catch (err) {
    log.error("Itinerary route error", { err: String(err) });
    return NextResponse.json({ error: "Server error", request_id: requestId }, { status: 500 });
  }
}
