import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { runAgent } from "@/lib/ai/run-agent";
import { saveItinerary } from "@/lib/ai/persist";
import { LeadTriageOutputSchema } from "@/lib/ai/schemas";
import type { ItineraryOutput } from "@/lib/ai/schemas";

const BodySchema = z
  .object({
    lead_id: z.string().uuid(),
    city: z.enum(["Medellín", "Manizales"]).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    days: z.coerce.number().int().min(2).max(14).optional(),
    includes_tour: z.boolean().optional(),
  })
  .strict();

function inferCityFromLead(packageSlug: string | null | undefined): "Medellín" | "Manizales" | null {
  if (packageSlug === "smile-manizales") return "Manizales";
  if (packageSlug === "smile-medellin") return "Medellín";
  return null;
}

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

    const { lead_id, city: bodyCity, start_date, days = 5, includes_tour } = parsed.data;

    const supabase = getServerSupabase();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, first_name, last_name, country, package_slug, message")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found", request_id: requestId }, { status: 404 });
    }

    const { data: aiRows } = await supabase
      .from("lead_ai")
      .select("triage_json")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false })
      .limit(1);
    const triageMaybe = LeadTriageOutputSchema.safeParse(aiRows?.[0]?.triage_json);
    const inferredCity =
      bodyCity ??
      inferCityFromLead(lead.package_slug) ??
      (triageMaybe.success ? triageMaybe.data.recommended_city : null) ??
      "Medellín";

    let packageId: string | null = null;
    if (lead.package_slug) {
      const { data: pkg } = await supabase.from("packages").select("id").eq("slug", lead.package_slug).maybeSingle();
      packageId = (pkg?.id as string | undefined) ?? null;
    }

    const input = {
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
    };

    const result = await runAgent<ItineraryOutput>("itinerary-generator", input, { requestId });
    const { id } = await saveItinerary(lead_id, result.output as unknown as Record<string, unknown>, {
      city: result.output.city,
      packageId,
    });

    log.info("Itinerary generated", { lead_id, itinerary_id: id });
    return NextResponse.json({ itinerary: result.output, request_id: requestId });
  } catch (err) {
    log.error("Itinerary route error", { err: String(err) });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error", request_id: requestId },
      { status: 502 }
    );
  }
}
