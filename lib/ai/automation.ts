import { callAgent, callSalesResponder } from "@/lib/ai/openai";
import { getAgentSystemPrompt } from "@/lib/ai/prompts";
import {
  ItineraryOutputSchema,
  LeadTriageOutputSchema,
  OpsCoordinatorOutputSchema,
} from "@/lib/ai/schemas";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";

type AutomationContext = {
  requestId?: string;
  ctaUrl?: string;
};

type FollowupMode = "inactive_24h" | "inactive_48h";

type LeadRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  package_slug: string | null;
  message: string | null;
  status: string;
  created_at: string;
  last_contacted_at: string | null;
};

type LeadAiRow = {
  id: string;
  triage_json: unknown;
  triage_completed: boolean;
  response_generated: boolean;
  itinerary_generated: boolean;
  ops_generated: boolean;
  followup_24h_json: unknown;
  followup_48h_json: unknown;
};

type InactiveFollowupResult = {
  scanned: number;
  generated_24h: number;
  generated_48h: number;
};

const ACTIVE_FOLLOWUP_STATUSES = ["new", "contacted", "qualified"];
const MS_PER_HOUR = 60 * 60 * 1000;

function openAiConfigured(): boolean {
  return typeof process.env.OPENAI_API_KEY === "string" && process.env.OPENAI_API_KEY.length > 0;
}

function inferCityFromLead(packageSlug: string | null | undefined): "Medellín" | "Manizales" | null {
  if (packageSlug === "smile-manizales") return "Manizales";
  if (packageSlug === "smile-medellin") return "Medellín";
  return null;
}

async function fetchLead(leadId: string): Promise<LeadRow | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("id, first_name, last_name, email, phone, country, package_slug, message, status, created_at, last_contacted_at")
    .eq("id", leadId)
    .maybeSingle();
  if (error || !data) return null;
  return data as LeadRow;
}

async function getOrCreateLeadAi(leadId: string): Promise<LeadAiRow> {
  const supabase = getServerSupabase();
  const { data: existingRows, error: existingError } = await supabase
    .from("lead_ai")
    .select("id, triage_json, triage_completed, response_generated, itinerary_generated, ops_generated, followup_24h_json, followup_48h_json")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (existingError) {
    throw new Error(`Failed to load lead_ai: ${existingError.message}`);
  }
  if (existingRows && existingRows[0]) {
    return existingRows[0] as LeadAiRow;
  }

  const now = new Date().toISOString();
  const { data: inserted, error: insertError } = await supabase
    .from("lead_ai")
    .insert({ lead_id: leadId, updated_at: now })
    .select("id, triage_json, triage_completed, response_generated, itinerary_generated, ops_generated, followup_24h_json, followup_48h_json")
    .single();
  if (insertError || !inserted) {
    throw new Error(`Failed to create lead_ai: ${String(insertError)}`);
  }
  return inserted as LeadAiRow;
}

async function updateLeadAiById(id: string, patch: Record<string, unknown>) {
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("lead_ai")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    throw new Error(`Failed to update lead_ai row: ${error.message}`);
  }
}

async function runLeadTriageForLead(leadId: string, requestId?: string) {
  const log = createLogger(requestId);
  if (!openAiConfigured()) {
    log.warn("Skipping triage automation: OPENAI_API_KEY missing", { lead_id: leadId });
    return;
  }

  const lead = await fetchLead(leadId);
  if (!lead) {
    log.warn("Skipping triage automation: lead not found", { lead_id: leadId });
    return;
  }

  const leadAi = await getOrCreateLeadAi(leadId);
  if (leadAi.triage_completed) {
    return;
  }

  const systemPrompt = await getAgentSystemPrompt("lead-triage");
  const triageRaw = await callAgent({
    agentName: "lead-triage",
    systemPrompt,
    userJson: {
      name: `${lead.first_name} ${lead.last_name}`.trim(),
      email: lead.email,
      phone: lead.phone,
      preferred_city: inferCityFromLead(lead.package_slug),
      desired_dates: null,
      notes: lead.message,
      package_slug: lead.package_slug,
    },
  });
  const triageParsed = LeadTriageOutputSchema.safeParse(triageRaw);
  if (!triageParsed.success) {
    throw new Error(`Invalid triage output: ${JSON.stringify(triageParsed.error.flatten())}`);
  }

  await updateLeadAiById(leadAi.id, {
    triage_json: triageParsed.data,
    triage_completed: true,
  });
  log.info("Automation triage completed", { lead_id: leadId });
}

async function runSalesResponderForLead(
  leadId: string,
  context: AutomationContext & { mode: "lead_created" | FollowupMode },
) {
  const log = createLogger(context.requestId);
  if (!openAiConfigured()) {
    log.warn("Skipping responder automation: OPENAI_API_KEY missing", { lead_id: leadId, mode: context.mode });
    return;
  }

  const lead = await fetchLead(leadId);
  if (!lead) {
    log.warn("Skipping responder automation: lead not found", { lead_id: leadId, mode: context.mode });
    return;
  }
  const leadAi = await getOrCreateLeadAi(leadId);

  if (context.mode === "lead_created" && leadAi.response_generated) {
    return;
  }
  if (context.mode === "inactive_24h" && leadAi.followup_24h_json) {
    return;
  }
  if (context.mode === "inactive_48h" && leadAi.followup_48h_json) {
    return;
  }

  const triageMaybe = LeadTriageOutputSchema.safeParse(leadAi.triage_json);
  const ctaUrl = context.ctaUrl ?? "https://example.com/assessment";
  const responderOutput = await callSalesResponder({
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

  const payload = {
    ...responderOutput,
    generated_at: new Date().toISOString(),
    automation_trigger: context.mode,
    lead_snapshot_minimal: {
      lead_id: lead.id,
      name: `${lead.first_name} ${lead.last_name}`.trim(),
      email: lead.email,
      country: lead.country,
      package_slug: lead.package_slug,
    },
  };

  if (context.mode === "lead_created") {
    await updateLeadAiById(leadAi.id, {
      messages_json: payload,
      response_generated: true,
    });
  } else if (context.mode === "inactive_24h") {
    await updateLeadAiById(leadAi.id, {
      followup_24h_json: payload,
    });
  } else {
    await updateLeadAiById(leadAi.id, {
      followup_48h_json: payload,
    });
  }
  log.info("Automation responder completed", { lead_id: leadId, mode: context.mode });
}

async function runItineraryForLead(leadId: string, requestId?: string) {
  const log = createLogger(requestId);
  if (!openAiConfigured()) {
    log.warn("Skipping itinerary automation: OPENAI_API_KEY missing", { lead_id: leadId });
    return;
  }

  const lead = await fetchLead(leadId);
  if (!lead) {
    log.warn("Skipping itinerary automation: lead not found", { lead_id: leadId });
    return;
  }
  const leadAi = await getOrCreateLeadAi(leadId);
  if (leadAi.itinerary_generated) {
    return;
  }

  const supabase = getServerSupabase();
  const { data: itineraryRows, error: itineraryLookupError } = await supabase
    .from("itineraries")
    .select("id")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (itineraryLookupError) {
    throw new Error(`Failed to check existing itinerary: ${itineraryLookupError.message}`);
  }
  if (itineraryRows && itineraryRows[0]) {
    await updateLeadAiById(leadAi.id, { itinerary_generated: true });
    return;
  }

  let packageId: string | null = null;
  if (lead.package_slug) {
    const { data: packageRow } = await supabase
      .from("packages")
      .select("id")
      .eq("slug", lead.package_slug)
      .maybeSingle();
    packageId = (packageRow?.id as string | undefined) ?? null;
  }

  const triageMaybe = LeadTriageOutputSchema.safeParse(leadAi.triage_json);
  const city =
    inferCityFromLead(lead.package_slug)
    ?? (triageMaybe.success ? triageMaybe.data.recommended_city : null)
    ?? "Medellín";

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
      city,
      start_date: null,
      days: 5,
      includes_tour: false,
    },
  });
  const itineraryParsed = ItineraryOutputSchema.safeParse(itineraryRaw);
  if (!itineraryParsed.success) {
    throw new Error(`Invalid itinerary output: ${JSON.stringify(itineraryParsed.error.flatten())}`);
  }

  const itinerary = itineraryParsed.data;
  const { error: itineraryInsertError } = await supabase.from("itineraries").insert({
    lead_id: leadId,
    package_id: packageId,
    city: itinerary.city,
    content_json: itinerary,
    day_index: 1,
    title: "AI itinerary",
    description: itinerary.whatsapp_summary,
    updated_at: new Date().toISOString(),
  });
  if (itineraryInsertError) {
    throw new Error(`Failed to save itinerary: ${itineraryInsertError.message}`);
  }

  await updateLeadAiById(leadAi.id, { itinerary_generated: true });
  log.info("Automation itinerary completed", { lead_id: leadId });
}

async function runOpsCoordinatorForLead(leadId: string, requestId?: string) {
  const log = createLogger(requestId);
  if (!openAiConfigured()) {
    log.warn("Skipping ops automation: OPENAI_API_KEY missing", { lead_id: leadId });
    return;
  }

  const lead = await fetchLead(leadId);
  if (!lead) {
    log.warn("Skipping ops automation: lead not found", { lead_id: leadId });
    return;
  }
  const leadAi = await getOrCreateLeadAi(leadId);
  if (leadAi.ops_generated) {
    return;
  }

  const supabase = getServerSupabase();
  const { data: itineraryRows } = await supabase
    .from("itineraries")
    .select("content_json")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1);
  const triageMaybe = LeadTriageOutputSchema.safeParse(leadAi.triage_json);
  const itineraryMaybe = ItineraryOutputSchema.safeParse(itineraryRows?.[0]?.content_json);

  const systemPrompt = await getAgentSystemPrompt("ops-coordinator");
  const opsRaw = await callAgent({
    agentName: "ops-coordinator",
    systemPrompt,
    userJson: {
      lead: {
        name: `${lead.first_name} ${lead.last_name}`.trim(),
        country: lead.country,
        package_slug: lead.package_slug,
        status: lead.status,
        notes: lead.message,
      },
      triage: triageMaybe.success ? triageMaybe.data : null,
      latest_itinerary: itineraryMaybe.success ? itineraryMaybe.data : null,
    },
  });
  const opsParsed = OpsCoordinatorOutputSchema.safeParse(opsRaw);
  if (!opsParsed.success) {
    throw new Error(`Invalid ops output: ${JSON.stringify(opsParsed.error.flatten())}`);
  }

  await updateLeadAiById(leadAi.id, {
    ops_json: opsParsed.data,
    ops_generated: true,
  });
  log.info("Automation ops completed", { lead_id: leadId });
}

export async function triggerLeadCreatedAutomation(leadId: string, context: AutomationContext = {}) {
  const log = createLogger(context.requestId);
  try {
    await runLeadTriageForLead(leadId, context.requestId);
  } catch (err) {
    log.error("Lead-created triage automation failed", {
      lead_id: leadId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  try {
    await runSalesResponderForLead(leadId, {
      ...context,
      mode: "lead_created",
    });
  } catch (err) {
    log.error("Lead-created responder automation failed", {
      lead_id: leadId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function triggerDepositPaidAutomation(leadId: string, context: AutomationContext = {}) {
  const log = createLogger(context.requestId);
  try {
    await runItineraryForLead(leadId, context.requestId);
  } catch (err) {
    log.error("Deposit-paid itinerary automation failed", {
      lead_id: leadId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  try {
    await runOpsCoordinatorForLead(leadId, context.requestId);
  } catch (err) {
    log.error("Deposit-paid ops automation failed", {
      lead_id: leadId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function runInactiveFollowupAutomation(
  options: {
    requestId?: string;
    ctaUrl?: string;
    limit?: number;
    now?: Date;
  } = {},
): Promise<InactiveFollowupResult> {
  const now = options.now ?? new Date();
  const log = createLogger(options.requestId);
  const limit = options.limit ?? 200;
  const result: InactiveFollowupResult = {
    scanned: 0,
    generated_24h: 0,
    generated_48h: 0,
  };

  if (!openAiConfigured()) {
    log.warn("Skipping inactive followup automation: OPENAI_API_KEY missing");
    return result;
  }

  const supabase = getServerSupabase();
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, status, created_at, last_contacted_at")
    .in("status", ACTIVE_FOLLOWUP_STATUSES)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) {
    throw new Error(`Failed to list leads for inactive followup: ${error.message}`);
  }

  for (const lead of (leads ?? []) as Array<{
    id: string;
    status: string;
    created_at: string;
    last_contacted_at: string | null;
  }>) {
    result.scanned += 1;
    const referenceIso = lead.last_contacted_at ?? lead.created_at;
    const reference = new Date(referenceIso).getTime();
    if (Number.isNaN(reference)) continue;
    const inactiveHours = (now.getTime() - reference) / MS_PER_HOUR;
    if (inactiveHours < 24) continue;

    if (inactiveHours >= 48) {
      try {
        await runSalesResponderForLead(lead.id, {
          requestId: options.requestId,
          ctaUrl: options.ctaUrl,
          mode: "inactive_48h",
        });
        result.generated_48h += 1;
      } catch (err) {
        log.error("Inactive 48h followup generation failed", {
          lead_id: lead.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      continue;
    }

    try {
      await runSalesResponderForLead(lead.id, {
        requestId: options.requestId,
        ctaUrl: options.ctaUrl,
        mode: "inactive_24h",
      });
      result.generated_24h += 1;
    } catch (err) {
      log.error("Inactive 24h followup generation failed", {
        lead_id: lead.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}
