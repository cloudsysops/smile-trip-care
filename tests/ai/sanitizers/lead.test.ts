import { describe, expect, it } from "vitest";
import { sanitizeLead, type Lead } from "@/lib/ai/sanitizers/lead";

describe("AI lead sanitizer (Claude input)", () => {
  it("should sanitize PII and medical details (allowlist only)", () => {
    const lead = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "qualified",
      source: "assessment",
      created_at: "2026-03-19T15:20:00.000Z",
      country: "Colombia",
      package_slug: "smile-medellin",
      selected_specialties: ["Dental Implants"],
      budget_range: "$5,000-$10,000",

      // PII that must never be forwarded:
      email: "juan.perez@example.com",
      phone: "+57 300 123 4567",
      first_name: "Juan",
      last_name: "Perez",

      // Medical details must not be forwarded:
      message: "I have a tooth abscess and severe pain. I need surgery soon.",

      // Payment info must not be forwarded (if present):
      payment_amount_cents: 123,
    } satisfies Lead as unknown as Lead;

    const out = sanitizeLead(lead);

    // Allowlist required fields
    expect(out.id).toBe(lead.id);
    expect(out.status).toBe(lead.status);
    expect(out.source).toBe(lead.source);
    expect(out.createdAt).toBe(new Date(lead.created_at as string).toISOString());

    // Derived safe fields (allowlist only)
    expect(out.basicInfo.country).toBe("Colombia");
    expect(out.basicInfo.preferred_city).toBe("Medellín");
    expect(out.basicInfo.selected_specialties).toEqual(["implants"]);
    expect(out.basicInfo.budget_range).toBe("$5,000-$10,000");

    // Ensure PII / sensitive fields are not forwarded
    expect(out).not.toHaveProperty("email");
    expect(out).not.toHaveProperty("phone");
    expect(out).not.toHaveProperty("first_name");
    expect(out).not.toHaveProperty("last_name");

    // Ensure payment info not forwarded
    expect(out).not.toHaveProperty("payment_amount_cents");

    // Ensure sensitive content preview is omitted
    expect(out.basicInfo.message_preview).toBeUndefined();
  });

  it("should classify treatment category from message keywords when specialties are missing", () => {
    const lead = {
      id: "550e8400-e29b-41d4-a716-446655440001",
      status: "new",
      source: "assessment",
      created_at: "2026-03-19T15:20:00.000Z",
      package_slug: "smile-manizales",
      message: "I want veneers for my front teeth.",
    } satisfies Lead as unknown as Lead;

    const out = sanitizeLead(lead);
    expect(out.basicInfo.preferred_city).toBe("Manizales");
    expect(out.basicInfo.selected_specialties).toEqual(["veneers"]);
  });

  it("should derive city from package_slug", () => {
    const med = sanitizeLead({
      id: "550e8400-e29b-41d4-a716-446655440002",
      status: "new",
      source: "assessment",
      created_at: "2026-03-19T15:20:00.000Z",
      package_slug: "smile-medellin",
    } as Lead);

    expect(med.basicInfo.preferred_city).toBe("Medellín");

    const man = sanitizeLead({
      id: "550e8400-e29b-41d4-a716-446655440003",
      status: "new",
      source: "assessment",
      created_at: "2026-03-19T15:20:00.000Z",
      package_slug: "smile-manizales",
    } as Lead);

    expect(man.basicInfo.preferred_city).toBe("Manizales");
  });

  it("should not include budgetRange when input is a single exact number", () => {
    const out = sanitizeLead({
      id: "550e8400-e29b-41d4-a716-446655440004",
      status: "new",
      source: "assessment",
      created_at: "2026-03-19T15:20:00.000Z",
      budget_range: "5000",
    } as Lead);

    expect(out.basicInfo.budget_range).toBeUndefined();
  });
});

