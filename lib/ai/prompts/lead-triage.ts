import { z, type ZodSchema } from "zod";

export type SanitizedLead = Readonly<{
  /** Public identifier for correlation (no PII). */
  id: string;
  /** Current lead status in your system (e.g. new, qualified). */
  status: string;
  /** Source/channel that created the lead (e.g. assessment, harvester, admin). */
  source: string;
  /** ISO timestamp when the lead was created. */
  createdAt: string;
  /**
   * Basic, non-sensitive information used for triage.
   * NOTE: This must NOT include email/phone/full medical history or other PII.
   */
  basicInfo: Readonly<{
    package_slug?: string | null;
    preferred_city?: "Medellín" | "Manizales" | null;
    selected_specialties?: string[];
    budget_range?: string | null;
    desired_dates?: string | null;
    message_preview?: string | null;
  }>;
}>;

export const LeadSummarySchema = z
  .object({
    summary: z.string().min(1),
  })
  .strict();

export const LeadIntentSchema = z
  .object({
    intent: z.enum(["urgent_medical", "cosmetic_tourism", "price_comparison", "just_browsing"]),
  })
  .strict();

export const RecommendedActionSchema = z
  .object({
    action: z.enum(["immediate_call", "send_quote", "nurture_email", "assign_specialist"]),
  })
  .strict();

export type LeadSummary = z.infer<typeof LeadSummarySchema>;
export type LeadIntent = z.infer<typeof LeadIntentSchema>;
export type RecommendedAction = z.infer<typeof RecommendedActionSchema>;

const INTENT_EXAMPLES: Array<{ intent: LeadIntent["intent"]; example: string }> = [
  {
    intent: "urgent_medical",
    example:
      "The lead mentions a near-term timeline (e.g. surgery soon) and asks to confirm dates quickly.",
  },
  {
    intent: "cosmetic_tourism",
    example:
      "The lead is focused on aesthetic outcomes (veneers/hollywood smile) and travel experience, not medical urgency.",
  },
  {
    intent: "price_comparison",
    example:
      "The lead explicitly compares costs to the US/Europe or asks about savings/quotes.",
  },
  {
    intent: "just_browsing",
    example:
      "The lead is exploring options with no clear dates, no budget, and mostly asks general questions.",
  },
];

const ACTION_EXAMPLES: Array<{ action: RecommendedAction["action"]; example: string }> = [
  {
    action: "immediate_call",
    example: "Timeline is near-term or the lead asks for quick confirmation (call first).",
  },
  {
    action: "send_quote",
    example: "Budget or pricing context is present and the lead needs a quote/savings range.",
  },
  {
    action: "nurture_email",
    example: "Low urgency or missing details; send an email to guide them toward an assessment.",
  },
  {
    action: "assign_specialist",
    example: "Complex needs or specialist-specific focus; route to the right specialist for next step.",
  },
];

function formatLeadForPrompt(leadData: SanitizedLead): string {
  // Keep prompts token-cheap: only include fields we actually use.
  const {
    id,
    status,
    source,
    createdAt,
    basicInfo: {
      package_slug,
      preferred_city,
      selected_specialties,
      budget_range,
      desired_dates,
      message_preview,
    },
  } = leadData;

  return [
    `Lead:`,
    `- id: ${id}`,
    `- status: ${status}`,
    `- source: ${source}`,
    `- createdAt: ${createdAt}`,
    `- basicInfo:`,
    `  - package_slug: ${package_slug ?? "null"}`,
    `  - preferred_city: ${preferred_city ?? "null"}`,
    `  - selected_specialties: ${(selected_specialties ?? []).join(", ") || "[]"}`,
    `  - budget_range: ${budget_range ?? "null"}`,
    `  - desired_dates: ${desired_dates ?? "null"}`,
    `  - message_preview: ${message_preview ?? "null"}`,
  ].join("\n");
}

/**
 * Prompt to generate a concise 2–3 line summary of the lead.
 * The caller should ask the model for *strict JSON only* matching LeadSummarySchema.
 */
export function getLeadSummaryPrompt(leadData: SanitizedLead): string {
  const safeLead = formatLeadForPrompt(leadData);

  // Token-optimized: no long policy text, only output contract + compact examples.
  return [
    "You are triaging a medical travel lead.",
    "Task: produce a concise summary of the lead's interest and context in 2–3 lines.",
    "Return strict JSON only with this shape: {\"summary\": string}.",
    "",
    safeLead,
    "",
    "Example output:",
    `{"summary":"Interested in a Colombia dental journey. Prefers ${leadData.basicInfo.preferred_city ?? "Medellín"} and wants clear next steps after the assessment."}`,
  ].join("\n");
}

/**
 * Prompt to classify lead intent.
 * The caller should ask the model for *strict JSON only* matching LeadIntentSchema.
 */
export function getLeadIntentPrompt(leadData: SanitizedLead): string {
  const safeLead = formatLeadForPrompt(leadData);

  const intentExamplesText = INTENT_EXAMPLES.map((e) => `- ${e.intent}: ${e.example}`).join("\n");

  return [
    "You are triaging a medical travel lead.",
    "Task: classify the lead intent into one of: urgent_medical | cosmetic_tourism | price_comparison | just_browsing.",
    "Return strict JSON only with this shape: {\"intent\": string}.",
    "",
    "Intent examples:",
    intentExamplesText,
    "",
    safeLead,
  ].join("\n");
}

/**
 * Prompt to suggest the next action.
 * The caller should ask the model for *strict JSON only* matching RecommendedActionSchema.
 */
export function getRecommendedActionPrompt(leadData: SanitizedLead): string {
  const safeLead = formatLeadForPrompt(leadData);

  const actionExamplesText = ACTION_EXAMPLES.map((e) => `- ${e.action}: ${e.example}`).join("\n");

  return [
    "You are triaging a medical travel lead.",
    "Task: recommend the next step for the coordinator.",
    "Allowed actions: immediate_call | send_quote | nurture_email | assign_specialist.",
    "Return strict JSON only with this shape: {\"action\": string}.",
    "",
    "Action examples:",
    actionExamplesText,
    "",
    safeLead,
  ].join("\n");
}

/**
 * Small helper for typing; not required by the callers but useful in implementations.
 */
export type LeadTriageResponseSchema<T> = ZodSchema<T>;

