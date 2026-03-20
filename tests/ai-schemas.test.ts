import { describe, it, expect } from "vitest";
import {
  LeadTriageOutputSchema,
  SalesResponderOutputSchema,
  ItineraryOutputSchema,
  OpsTasksOutputSchema,
} from "@/lib/ai/schemas";

describe("AI output schemas", () => {
  it("LeadTriageOutputSchema accepts valid triage output", () => {
    const sample = {
      priority: "medium" as const,
      recommended_city: "Medellín" as const,
      recommended_package_slug: "smile-medellin" as const,
      confidence: 0.8,
      questions_to_ask: ["Preferred dates?"],
      risk_flags: ["missing_dates" as const],
      next_step: "request_more_info" as const,
    };
    expect(LeadTriageOutputSchema.safeParse(sample).success).toBe(true);
  });

  it("LeadTriageOutputSchema rejects extra fields", () => {
    const withExtra = {
      priority: "low",
      recommended_city: "Manizales",
      recommended_package_slug: "smile-manizales",
      confidence: 0.5,
      questions_to_ask: [],
      risk_flags: [],
      next_step: "send_pricing_range",
      extra: "no",
    };
    expect(LeadTriageOutputSchema.safeParse(withExtra).success).toBe(false);
  });

  it("SalesResponderOutputSchema accepts valid reply output", () => {
    const sample = {
      whatsapp_message: "Hi, thanks for your interest.",
      email_subject: "Next step",
      email_body: "Dear ...",
      followup_in_hours: 24 as const,
      tone: "premium" as const,
    };
    expect(SalesResponderOutputSchema.safeParse(sample).success).toBe(true);
  });

  it("ItineraryOutputSchema accepts valid itinerary", () => {
    const sample = {
      city: "Medellín" as const,
      day_by_day: [
        { day: 1, morning: "Arrival", afternoon: "Clinic coordination", evening: "Rest" },
      ],
      pre_trip_checklist: ["Passport"],
      post_trip_followup: ["Feedback"],
      whatsapp_summary: "Day 1 summary",
    };
    expect(ItineraryOutputSchema.safeParse(sample).success).toBe(true);
  });

  it("OpsTasksOutputSchema accepts valid ops output", () => {
    const sample = {
      tasks: [
        {
          title: "Confirm dates",
          due_relative: "before_arrival" as const,
          assignee: "coordinator" as const,
          notes: "Email",
        },
      ],
      summary: "One task.",
    };
    expect(OpsTasksOutputSchema.safeParse(sample).success).toBe(true);
  });

  it("OpsTasksOutputSchema rejects more than 8 tasks", () => {
    const sample = {
      tasks: Array.from({ length: 9 }, (_, i) => ({
        title: `Task ${i}`,
        due_relative: "before_arrival" as const,
        assignee: "coordinator" as const,
        notes: "",
      })),
      summary: "Too many",
    };
    expect(OpsTasksOutputSchema.safeParse(sample).success).toBe(false);
  });
});
