import { runChatJson } from "@/lib/ai/openai";
import { LeadCopilotOutputSchema, type LeadCopilotOutput } from "@/lib/ai/schemas";
import { branding } from "@/lib/branding";

export type LeadCopilotInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  package_slug?: string | null;
  message?: string | null;
  selected_specialties?: string[] | null;
  travel_companions?: string | null;
  budget_range?: string | null;
};

const SYSTEM_PROMPT = `You are a medical travel coordinator assistant for ${branding.productName} (dental care in Colombia: Medellín and Manizales).

Given a lead's form data, return a JSON object with exactly these keys (all strings except priority):
- summary: 1-3 sentence plain-English summary of the lead (treatment interest, timeline, context). No fluff.
- priority: one of "high", "medium", "low". Use high for: clear treatment + near-term timeline + budget; medium for: clear interest, less urgency; low for: exploratory or no timeline.
- whatsapp_draft: Short WhatsApp message (2-4 sentences) to send the lead. Friendly, professional. Thank them for the assessment, reference their interest, invite them to discuss on WhatsApp. Use the lead's first name. Do not include greeting like "Hi" twice.
- email_draft: Same intent as WhatsApp but email-appropriate length (2-5 sentences). Professional tone.
- email_subject: Optional. Short subject line for the email (e.g. "Your smile plan – next steps").

Rules:
- Use the lead's first name in the drafts.
- Do not invent data not present in the input.
- Keep drafts copy-paste ready; no placeholders like [NAME].
- Priority must be exactly "high", "medium", or "low".`;

/**
 * Generate lead summary, priority, and coordinator drafts using the LLM.
 * Returns null on any failure (missing key, parse error, API error); caller should fallback.
 */
export async function generateLeadCopilot(input: LeadCopilotInput): Promise<LeadCopilotOutput | null> {
  const payload = {
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone ?? null,
    country: input.country ?? null,
    package_slug: input.package_slug ?? null,
    message: input.message ?? null,
    treatment_interest: Array.isArray(input.selected_specialties) && input.selected_specialties.length > 0
      ? input.selected_specialties.join(", ")
      : input.package_slug ?? null,
    travel_companions: input.travel_companions ?? null,
    budget_range: input.budget_range ?? null,
  };

  try {
    const result = await runChatJson({
      systemPrompt: SYSTEM_PROMPT,
      userJson: payload,
    });
    const parsed = LeadCopilotOutputSchema.safeParse(result.json);
    if (!parsed.success) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

const FOLLOWUP_24H_PROMPT = `You are a medical travel coordinator for ${branding.productName} (dental in Colombia).

Given lead data, return a JSON object with one key: "message" (string).
Generate a short, friendly WhatsApp follow-up message for 24 hours after the lead submitted their assessment. Example tone:
"Hi [first name], just checking in to see if you had time to review your smile plan. Our coordinator can answer any questions about treatment and travel."
Use the lead's first name. Keep it to 2-3 sentences. No placeholders.`;

const FOLLOWUP_3DAY_PROMPT = `You are a medical travel coordinator for ${branding.productName} (dental in Colombia).

Given lead data, return a JSON object with one key: "message" (string).
Generate a short, soft follow-up for 3 days after no response. Example tone:
"If you're still considering treatment abroad, we can help you plan the timing and costs. Happy to walk you through the options."
Use the lead's first name. Keep it to 2-3 sentences. No pressure, no placeholders.`;

const FOLLOWUP_7DAY_PROMPT = `You are a medical travel coordinator for ${branding.productName} (dental in Colombia).

Given lead data, return a JSON object with one key: "message" (string).
Generate a short, final check-in for 7 days after no response. Example tone:
"We're here if you'd like to revisit your smile plan or have questions about treatment in Colombia. No pressure—reach out anytime."
Use the lead's first name. Keep it to 2-3 sentences. No placeholders.`;

function leadPayload(input: LeadCopilotInput): Record<string, unknown> {
  return {
    first_name: input.first_name,
    last_name: input.last_name,
    treatment_interest: Array.isArray(input.selected_specialties) && input.selected_specialties.length > 0
      ? input.selected_specialties.join(", ")
      : input.package_slug ?? null,
    message: input.message ?? null,
    budget_range: input.budget_range ?? null,
    country: input.country ?? null,
  };
}

/**
 * Generate a 24h follow-up message draft. Returns null on failure.
 */
export async function generateFollowUp24h(input: LeadCopilotInput): Promise<string | null> {
  try {
    const result = await runChatJson({
      systemPrompt: FOLLOWUP_24H_PROMPT,
      userJson: leadPayload(input),
    });
    const raw = result.json as { message?: unknown };
    const message = typeof raw?.message === "string" && raw.message.trim() ? raw.message.trim() : null;
    return message;
  } catch {
    return null;
  }
}

/**
 * Generate a 3-day follow-up message draft. Returns null on failure.
 */
export async function generateFollowUp3Day(input: LeadCopilotInput): Promise<string | null> {
  try {
    const result = await runChatJson({
      systemPrompt: FOLLOWUP_3DAY_PROMPT,
      userJson: leadPayload(input),
    });
    const raw = result.json as { message?: unknown };
    const message = typeof raw?.message === "string" && raw.message.trim() ? raw.message.trim() : null;
    return message;
  } catch {
    return null;
  }
}

/**
 * Generate a 7-day follow-up message draft. Returns null on failure.
 */
export async function generateFollowUp7Day(input: LeadCopilotInput): Promise<string | null> {
  try {
    const result = await runChatJson({
      systemPrompt: FOLLOWUP_7DAY_PROMPT,
      userJson: leadPayload(input),
    });
    const raw = result.json as { message?: unknown };
    const message = typeof raw?.message === "string" && raw.message.trim() ? raw.message.trim() : null;
    return message;
  } catch {
    return null;
  }
}

/**
 * Build a fallback summary and drafts when AI is unavailable or fails.
 */
export function getLeadCopilotFallback(input: LeadCopilotInput): LeadCopilotOutput {
  const name = [input.first_name, input.last_name].filter(Boolean).join(" ") || "there";
  const treatment = Array.isArray(input.selected_specialties) && input.selected_specialties.length > 0
    ? input.selected_specialties.join(", ")
    : input.package_slug || "Not specified";
  const budgetLine = input.budget_range ? `Budget: ${input.budget_range}. ` : "";
  const countryLine = input.country ? `Country: ${input.country}.` : "";
  const summary = `Lead interested in ${treatment}. ${budgetLine}${countryLine}`.trim();
  return {
    summary,
    priority: "medium",
    whatsapp_draft: `Hi ${name}, thanks for completing your smile assessment. Based on your interest in ${treatment}, our coordinators can help review options and estimated savings. Would you like to discuss your treatment plan on WhatsApp?`,
    email_draft: `Hi ${name},\n\nThank you for completing your smile assessment. We've received your information and a coordinator will reach out to discuss your options and estimated savings.\n\nBest,\n${branding.productName} Team`,
    email_subject: "Your smile plan – next steps",
  };
}
