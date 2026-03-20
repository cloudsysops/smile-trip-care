import { callAgent, callSalesResponder } from "@/lib/ai/openai";
import { getAgentSystemPrompt } from "@/lib/ai/prompts";
import {
  ItineraryOutputSchema,
  LeadTriageOutputSchema,
  OpsCoordinatorOutputSchema,
} from "@/lib/ai/schemas";
import { createLogger } from "@/lib/logger";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  type AutomationJobRecord,
  type AutomationJobType,
  type AutomationTriggerType,
  enqueueAutomationJobs,
} from "@/lib/automation/queue";

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

type InactiveFollowupEnqueueResult = {
  scanned: number;
  enqueued_24h: number;
  enqueued_48h: number;
};

const ACTIVE_FOLLOWUP_STATUSES = ["new", "contacted", "qualified"];
const MS_PER_HOUR = 60 * 60 * 1000;

function inferCityFromLead(packageSlug: string | null | undefined): "Medellín" | "Manizales" | null {
  if (packageSlug === "smile-manizales") return "Manizales";
  if (packageSlug === "smile-medellin") return "Medellín";
  return null;
}

function normalizeMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function jobTypeForTrigger(
  triggerType: AutomationTriggerType,
  jobType: AutomationJobType,
): FollowupMode | "lead_created" | "deposit_paid" {
  if (triggerType === "lead_created") return "lead_created";
  if (triggerType === "lead_deposit_paid") return "deposit_paid";
  if (triggerType === "lead_inactive_24h" && jobType === "sales-responder") return "inactive_24h";
  if (triggerType === "lead_inactive_48h" && jobType === "sales-responder") return "inactive_48h";
  throw new Error(`Unsupported trigger/job pair: ${triggerType}/${jobType}`);
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
  const lead = await fetchLead(leadId);
  if (!lead) {
    log.warn("Skipping triage automation: lead not found", { lead_id: leadId });
    return;
  }
  const leadAi = await getOrCreateLeadAi(leadId);
  if (leadAi.triage_completed) return;

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
}

async function runSalesResponderForLead(
  leadId: string,
  context: AutomationContext & { mode: "lead_created" | FollowupMode },
) {
  const lead = await fetchLead(leadId);
  if (!lead) return;
  const leadAi = await getOrCreateLeadAi(leadId);

  if (context.mode === "lead_created" && leadAi.response_generated) return;
  if (context.mode === "inactive_24h" && leadAi.followup_24h_json) return;
  if (context.mode === "inactive_48h" && leadAi.followup_48h_json) return;

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
}

async function runItineraryForLead(leadId: string) {
  const lead = await fetchLead(leadId);
  if (!lead) return;
  const leadAi = await getOrCreateLeadAi(leadId);
  if (leadAi.itinerary_generated) return;

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
}

async function runOpsCoordinatorForLead(leadId: string) {
  const lead = await fetchLead(leadId);
  if (!lead) return;
  const leadAi = await getOrCreateLeadAi(leadId);
  if (leadAi.ops_generated) return;

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
}

export async function enqueueLeadCreatedAutomationJobs(
  leadId: string,
  context: AutomationContext = {},
) {
  return enqueueAutomationJobs({
    leadId,
    triggerType: "lead_created",
    jobTypes: ["lead-triage", "sales-responder"],
    payload: {
      cta_url: context.ctaUrl ?? null,
    },
  });
}

export async function enqueueDepositPaidAutomationJobs(
  leadId: string,
) {
  return enqueueAutomationJobs({
    leadId,
    triggerType: "lead_deposit_paid",
    jobTypes: ["itinerary-generator", "ops-coordinator"],
    payload: {},
  });
}

export async function enqueueInactiveFollowupJobs(
  options: {
    requestId?: string;
    ctaUrl?: string;
    limit?: number;
    now?: Date;
  } = {},
): Promise<InactiveFollowupEnqueueResult> {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 200;
  const result: InactiveFollowupEnqueueResult = {
    scanned: 0,
    enqueued_24h: 0,
    enqueued_48h: 0,
  };

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
      const jobs = await enqueueAutomationJobs({
        leadId: lead.id,
        triggerType: "lead_inactive_48h",
        jobTypes: ["sales-responder"],
        payload: { cta_url: options.ctaUrl ?? null },
      });
      result.enqueued_48h += jobs.length;
    } else {
      const jobs = await enqueueAutomationJobs({
        leadId: lead.id,
        triggerType: "lead_inactive_24h",
        jobTypes: ["sales-responder"],
        payload: { cta_url: options.ctaUrl ?? null },
      });
      result.enqueued_24h += jobs.length;
    }
  }
  return result;
}

export async function executeAutomationJob(job: AutomationJobRecord, context: AutomationContext = {}) {
  const log = createLogger(context.requestId);
  const executionMode = jobTypeForTrigger(job.trigger_type, job.job_type);
  try {
    switch (job.job_type) {
      case "lead-triage":
        await runLeadTriageForLead(job.lead_id, context.requestId);
        break;
      case "sales-responder":
        if (executionMode === "lead_created") {
          await runSalesResponderForLead(job.lead_id, {
            requestId: context.requestId,
            ctaUrl: (job.payload_json?.cta_url as string | null | undefined) ?? context.ctaUrl,
            mode: "lead_created",
          });
        } else if (executionMode === "inactive_24h" || executionMode === "inactive_48h") {
          await runSalesResponderForLead(job.lead_id, {
            requestId: context.requestId,
            ctaUrl: (job.payload_json?.cta_url as string | null | undefined) ?? context.ctaUrl,
            mode: executionMode,
          });
        }
        break;
      case "itinerary-generator":
        await runItineraryForLead(job.lead_id);
        break;
      case "ops-coordinator":
        await runOpsCoordinatorForLead(job.lead_id);
        break;
      default:
        throw new Error(`Unsupported job type: ${job.job_type}`);
    }
  } catch (error) {
    log.error("Automation job execution failed", {
      job_id: job.id,
      lead_id: job.lead_id,
      trigger_type: job.trigger_type,
      job_type: job.job_type,
      error: normalizeMessage(error),
    });
    throw error;
  }
}
