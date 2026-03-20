/**
 * Follow-up engine for leads: generates 24h, 3-day, and 7-day message drafts using AI copilot logic.
 * Optional in-memory scheduling (no DB schema changes).
 */

import type { LeadCopilotInput } from "@/lib/ai/lead-copilot";
import {
  generateFollowUp24h,
  generateFollowUp3Day,
  generateFollowUp7Day,
} from "@/lib/ai/lead-copilot";

/** Minimal lead row shape for follow-up (e.g. from Supabase leads table). */
export type LeadForFollowUp = {
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

export type FollowUpSchedule = {
  at24h: Date;
  at3d: Date;
  at7d: Date;
};

export function mapLeadToCopilotInput(lead: LeadForFollowUp): LeadCopilotInput {
  return {
    first_name: lead.first_name ?? "",
    last_name: lead.last_name ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? null,
    country: lead.country ?? null,
    package_slug: lead.package_slug ?? null,
    message: lead.message ?? null,
    selected_specialties: lead.selected_specialties ?? null,
    travel_companions: lead.travel_companions ?? null,
    budget_range: lead.budget_range ?? null,
  };
}

/** Generate 24h follow-up draft. Returns null on failure. */
export async function generate24hFollowup(lead: LeadForFollowUp): Promise<string | null> {
  return generateFollowUp24h(mapLeadToCopilotInput(lead));
}

/** Generate 3-day follow-up draft. Returns null on failure. */
export async function generate3dFollowup(lead: LeadForFollowUp): Promise<string | null> {
  return generateFollowUp3Day(mapLeadToCopilotInput(lead));
}

/** Generate 7-day follow-up draft. Returns null on failure. */
export async function generate7dFollowup(lead: LeadForFollowUp): Promise<string | null> {
  return generateFollowUp7Day(mapLeadToCopilotInput(lead));
}

/**
 * Suggested follow-up timestamps from lead creation. In-memory only; no DB writes.
 * Use these to show coordinators when to send each follow-up or to drive reminders.
 */
export function scheduleFollowups(leadCreatedAt: Date | string): FollowUpSchedule {
  const base = new Date(leadCreatedAt);
  return {
    at24h: new Date(base.getTime() + 24 * 60 * 60 * 1000),
    at3d: new Date(base.getTime() + 3 * 24 * 60 * 60 * 1000),
    at7d: new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000),
  };
}
