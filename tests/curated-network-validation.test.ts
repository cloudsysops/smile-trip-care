import { describe, expect, it } from "vitest";
import { ProviderCreateSchema, ProviderUpdateSchema } from "@/lib/validation/provider";
import { SpecialistCreateSchema } from "@/lib/validation/specialist";
import { ExperienceCreateSchema } from "@/lib/validation/experience";
import { PackageCreateSchema } from "@/lib/validation/package";
import { ConsultationCreateSchema } from "@/lib/validation/consultation";
import { BookingCreateSchema } from "@/lib/validation/booking";

describe("Provider validation", () => {
  it("accepts valid provider create payload", () => {
    const result = ProviderCreateSchema.safeParse({
      name: "Clínica San Martín",
      city: "Medellín",
      provider_type: "clinic",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.country).toBe("Colombia");
      expect(result.data.approval_status).toBe("pending");
    }
  });

  it("rejects invalid provider_type", () => {
    const result = ProviderCreateSchema.safeParse({
      name: "Test",
      city: "Medellín",
      provider_type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid provider update (partial)", () => {
    const result = ProviderUpdateSchema.safeParse({
      published: true,
      approval_status: "approved",
    });
    expect(result.success).toBe(true);
  });
});

describe("Specialist validation", () => {
  it("accepts valid specialist create", () => {
    const result = SpecialistCreateSchema.safeParse({
      name: "Dr. Jane",
      specialty: "Dental",
      city: "Medellín",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.free_evaluation).toBe(true);
      expect(result.data.approval_status).toBe("pending");
    }
  });

  it("rejects missing required name", () => {
    const result = SpecialistCreateSchema.safeParse({
      specialty: "Dental",
      city: "Medellín",
    });
    expect(result.success).toBe(false);
  });
});

describe("Experience validation", () => {
  it("accepts valid experience create", () => {
    const result = ExperienceCreateSchema.safeParse({
      name: "Coffee Tour",
      city: "Manizales",
      category: "nature",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("nature");
      expect(result.data.published).toBe(false);
    }
  });

  it("rejects invalid category", () => {
    const result = ExperienceCreateSchema.safeParse({
      name: "Tour",
      city: "Medellín",
      category: "invalid_category",
    });
    expect(result.success).toBe(false);
  });
});

describe("Package validation", () => {
  it("accepts valid package create", () => {
    const result = PackageCreateSchema.safeParse({
      slug: "essential-care",
      name: "Essential Care Journey",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.highlights).toEqual([]);
      expect(result.data.includes).toEqual([]);
    }
  });

  it("rejects invalid slug format", () => {
    const result = PackageCreateSchema.safeParse({
      slug: "Invalid Slug!",
      name: "Test",
    });
    expect(result.success).toBe(false);
  });
});

describe("Consultation validation", () => {
  it("accepts valid consultation create", () => {
    const result = ConsultationCreateSchema.safeParse({
      lead_id: "550e8400-e29b-41d4-a716-446655440000",
      specialist_id: "550e8400-e29b-41d4-a716-446655440001",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("requested");
    }
  });
});

describe("Booking validation", () => {
  it("accepts valid booking create", () => {
    const result = BookingCreateSchema.safeParse({
      lead_id: "550e8400-e29b-41d4-a716-446655440000",
      package_id: "550e8400-e29b-41d4-a716-446655440002",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("draft");
      expect(result.data.deposit_paid).toBe(false);
    }
  });
});
