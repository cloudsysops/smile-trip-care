import { describe, expect, it } from "vitest";
import { LeadCreateSchema } from "@/lib/validation/lead";

describe("LeadCreateSchema (assessment extended)", () => {
  it("accepts minimal valid payload", () => {
    const result = LeadCreateSchema.safeParse({
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.specialist_ids).toEqual([]);
      expect(result.data.experience_ids).toEqual([]);
      expect(result.data.selected_specialties).toEqual([]);
      expect(result.data.selected_experience_categories).toEqual([]);
      expect(result.data.selected_experience_ids).toEqual([]);
    }
  });

  it("accepts new optional fields: travel_companions, budget_range, utm_*, selected_*", () => {
    const result = LeadCreateSchema.safeParse({
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      travel_companions: "spouse",
      budget_range: "$3,000–5,000",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "smile",
      selected_specialties: ["Dental", "Wellness"],
      selected_experience_categories: ["nature", "wellness"],
      selected_experience_ids: ["550e8400-e29b-41d4-a716-446655440000"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.travel_companions).toBe("spouse");
      expect(result.data.budget_range).toBe("$3,000–5,000");
      expect(result.data.utm_source).toBe("google");
      expect(result.data.selected_specialties).toEqual(["Dental", "Wellness"]);
      expect(result.data.selected_experience_ids).toHaveLength(1);
    }
  });

  it("rejects when required fields missing", () => {
    const result = LeadCreateSchema.safeParse({
      first_name: "Jane",
      last_name: "Doe",
      // email missing
    });
    expect(result.success).toBe(false);
  });
});
