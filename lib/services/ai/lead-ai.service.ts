import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import {
  LeadSummarySchema,
  LeadIntentSchema,
  RecommendedActionSchema,
  getLeadSummaryPrompt,
  getLeadIntentPrompt,
  getRecommendedActionPrompt,
  type LeadSummary,
  type LeadIntent,
  type RecommendedAction,
  type SanitizedLead,
} from "@/lib/ai/prompts/lead-triage";
import { sanitizeLead, type Lead as SanitizerLead } from "@/lib/ai/sanitizers/lead";
import { generateStructuredResponse } from "@/lib/ai/claude";

const LeadIdSchema = z.string().uuid();

const LeadAnalysisSchema = LeadSummarySchema.merge(LeadIntentSchema).merge(RecommendedActionSchema).strict();

export type LeadAnalysis = z.infer<typeof LeadAnalysisSchema>;

type LeadRow = {
  id: string;
  status: string;
  created_at: string;
  country?: string | null;
  package_slug?: string | null;
  selected_specialties?: unknown;
  budget_range?: string | null;
  message?: string | null;
  utm_source?: string | null;
  landing_path?: string | null;
};

function normalizeSelectedSpecialties(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

async function fetchLeadForSanitization(leadId: string, log: ReturnType<typeof createLogger>): Promise<SanitizedLead> {
  const supabase = getServerSupabase();

  const { data: lead, error } = await supabase
    .from("leads")
    .select(
      [
        "id",
        "status",
        "created_at",
        "country",
        "package_slug",
        "selected_specialties",
        "budget_range",
        "message",
        "utm_source",
        "landing_path",
      ].join(","),
    )
    .eq("id", leadId)
    .single();

  if (error) {
    log.error("Lead fetch failed", {
      lead_id: leadId,
      error: error.message,
      supabase_code: error.code ?? null,
    });
    throw new Error("lead_fetch_failed");
  }

  if (!lead) {
    throw new Error("lead_not_found");
  }

  const row = lead as unknown as LeadRow;
  const derivedSource = (typeof row.utm_source === "string" && row.utm_source.trim() ? row.utm_source : row.landing_path) ?? "assessment";

  const leadForSanitizer: SanitizerLead = {
    id: row.id,
    status: row.status,
    source: derivedSource,
    created_at: row.created_at,
    country: row.country ?? null,
    package_slug: row.package_slug ?? null,
    selected_specialties: normalizeSelectedSpecialties(row.selected_specialties),
    budget_range: row.budget_range ?? null,
    message: row.message ?? null,
  };

  log.info("Lead fetched; sanitizing", { lead_id: leadId });
  return sanitizeLead(leadForSanitizer);
}

function buildLeadAnalysisPrompt(lead: SanitizedLead): string {
  const intentAllowed = [
    "urgent_medical",
    "cosmetic_tourism",
    "price_comparison",
    "just_browsing",
    "unknown",
  ] as const;
  const actionAllowed = ["immediate_call", "send_quote", "nurture_email", "assign_specialist", "manual_review"] as const;

  const basicInfo = lead.basicInfo ?? {};

  const preferredCity = basicInfo.preferred_city ?? "null";
  const selectedSpecialties = Array.isArray(basicInfo.selected_specialties) ? basicInfo.selected_specialties.join(", ") : "[]";

  return [
    "You are an AI assistant helping triage dental travel leads.",
    "",
    "Task 1: Summarize the lead in 2-3 concise lines.",
    "Task 2: Classify the lead intent into one value from the allowed list:",
    `- ${intentAllowed.join(", ")}`,
    "Task 3: Recommend the next step into one value from the allowed list:",
    `- ${actionAllowed.join(", ")}`,
    "",
    "Lead context (safe, PII-free):",
    `- id: ${lead.id}`,
    `- status: ${lead.status}`,
    `- source: ${lead.source}`,
    `- createdAt: ${lead.createdAt}`,
    `- basicInfo.preferred_city: ${preferredCity}`,
    `- basicInfo.selected_specialties: ${selectedSpecialties}`,
    `- basicInfo.budget_range: ${basicInfo.budget_range ?? "null"}`,
    `- basicInfo.country: ${basicInfo.country ?? "null"}`,
    "",
    "Return STRICT JSON only with EXACT keys: summary, intent, action.",
    "No markdown, no explanations.",
  ].join("\n");
}

export async function summarizeLead(leadId: string): Promise<LeadSummary> {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  const parsedLeadId = LeadIdSchema.safeParse(leadId);
  if (!parsedLeadId.success) {
    log.warn("summarizeLead invalid leadId", { lead_id: leadId });
    throw new Error("invalid_lead_id");
  }

  try {
    log.info("summarizeLead start", { lead_id: leadId });
    const sanitized = await fetchLeadForSanitization(leadId, log);
    const prompt = getLeadSummaryPrompt(sanitized);
    log.info("summarizeLead calling Claude", { lead_id: leadId });
    const result = await generateStructuredResponse(prompt, LeadSummarySchema, {
      maxTokens: 256,
      temperature: 0.2,
      fallbackType: "LEAD_SUMMARY_FALLBACK",
    });
    log.info("summarizeLead success", { lead_id: leadId });
    return result;
  } catch (err) {
    log.error("summarizeLead failed", {
      lead_id: leadId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export async function classifyLeadIntent(leadId: string): Promise<LeadIntent> {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  const parsedLeadId = LeadIdSchema.safeParse(leadId);
  if (!parsedLeadId.success) {
    log.warn("classifyLeadIntent invalid leadId", { lead_id: leadId });
    throw new Error("invalid_lead_id");
  }

  try {
    log.info("classifyLeadIntent start", { lead_id: leadId });
    const sanitized = await fetchLeadForSanitization(leadId, log);
    const prompt = getLeadIntentPrompt(sanitized);
    log.info("classifyLeadIntent calling Claude", { lead_id: leadId });
    const result = await generateStructuredResponse(prompt, LeadIntentSchema, {
      maxTokens: 256,
      temperature: 0.2,
      fallbackType: "LEAD_INTENT_FALLBACK",
    });
    log.info("classifyLeadIntent success", { lead_id: leadId });
    return result;
  } catch (err) {
    log.error("classifyLeadIntent failed", {
      lead_id: leadId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export async function recommendNextStep(leadId: string): Promise<RecommendedAction> {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  const parsedLeadId = LeadIdSchema.safeParse(leadId);
  if (!parsedLeadId.success) {
    log.warn("recommendNextStep invalid leadId", { lead_id: leadId });
    throw new Error("invalid_lead_id");
  }

  try {
    log.info("recommendNextStep start", { lead_id: leadId });
    const sanitized = await fetchLeadForSanitization(leadId, log);
    const prompt = getRecommendedActionPrompt(sanitized);
    log.info("recommendNextStep calling Claude", { lead_id: leadId });
    const result = await generateStructuredResponse(prompt, RecommendedActionSchema, {
      maxTokens: 256,
      temperature: 0.2,
      fallbackType: "RECOMMENDED_ACTION_FALLBACK",
    });
    log.info("recommendNextStep success", { lead_id: leadId });
    return result;
  } catch (err) {
    log.error("recommendNextStep failed", {
      lead_id: leadId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export async function analyzeLeadComplete(leadId: string): Promise<LeadAnalysis> {
  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  const parsedLeadId = LeadIdSchema.safeParse(leadId);
  if (!parsedLeadId.success) {
    log.warn("analyzeLeadComplete invalid leadId", { lead_id: leadId });
    throw new Error("invalid_lead_id");
  }

  try {
    log.info("analyzeLeadComplete start", { lead_id: leadId });
    const sanitized = await fetchLeadForSanitization(leadId, log);
    const prompt = buildLeadAnalysisPrompt(sanitized);
    log.info("analyzeLeadComplete calling Claude (single request)", { lead_id: leadId });

    const result = await generateStructuredResponse(prompt, LeadAnalysisSchema, {
      maxTokens: 512,
      temperature: 0.2,
      fallbackType: "LEAD_ANALYSIS_FALLBACK",
    });

    log.info("analyzeLeadComplete success", { lead_id: leadId });
    return result;
  } catch (err) {
    log.error("analyzeLeadComplete failed", {
      lead_id: leadId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

