import { z } from "zod";

export const LeadTriageOutputSchema = z.object({
  priority: z.enum(["low", "medium", "high"]),
  recommended_city: z.enum(["Medellín", "Manizales"]),
  recommended_package_slug: z.enum(["smile-medellin", "smile-manizales"]),
  confidence: z.number().min(0).max(1),
  questions_to_ask: z.array(z.string().min(1)).max(3),
  risk_flags: z.array(z.enum(["missing_dates", "missing_budget", "unclear_goal", "other"])),
  next_step: z.enum(["schedule_call", "request_more_info", "send_pricing_range", "send_deposit_link"]),
}).strict();

export const SalesResponderOutputSchema = z.object({
  whatsapp_message: z.string().min(1),
  email_subject: z.string().min(1),
  email_body: z.string().min(1),
  followup_in_hours: z.literal(24),
  tone: z.enum(["premium", "friendly"]),
}).strict();

export const ItineraryOutputSchema = z.object({
  city: z.enum(["Medellín", "Manizales"]),
  day_by_day: z.array(z.object({
    day: z.number().int().positive(),
    morning: z.string().min(1),
    afternoon: z.string().min(1),
    evening: z.string().min(1),
  }).strict()).min(1),
  pre_trip_checklist: z.array(z.string().min(1)),
  post_trip_followup: z.array(z.string().min(1)),
  whatsapp_summary: z.string().min(1),
}).strict();

export const OpsCoordinatorOutputSchema = z.object({
  operational_priority: z.enum(["standard", "high"]),
  coordination_tasks: z.array(
    z.object({
      task: z.string().min(1),
      owner: z.enum(["coordinator", "patient", "clinic", "transport"]),
      due_in_hours: z.number().int().min(0).max(168),
    }).strict(),
  ).min(1).max(10),
  blockers: z.array(z.string().min(1)).max(5),
  patient_message_summary: z.string().min(1),
  internal_note: z.string().min(1),
}).strict();

export type LeadTriageOutput = z.infer<typeof LeadTriageOutputSchema>;
export type SalesResponderOutput = z.infer<typeof SalesResponderOutputSchema>;
export type ItineraryOutput = z.infer<typeof ItineraryOutputSchema>;
export type OpsCoordinatorOutput = z.infer<typeof OpsCoordinatorOutputSchema>;
