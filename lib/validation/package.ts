import { z } from "zod";

const UuidSchema = z.string().uuid();

export const PackageTypeSchema = z.enum(["health", "tour", "combo"]);

export const PackageCreateSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(300),
  provider_id: UuidSchema.optional().nullable(),
  package_type: PackageTypeSchema.optional(),
  type: PackageTypeSchema.optional(),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  origin_city: z.string().max(100).optional(),
  destination_city: z.string().max(100).optional(),
  recovery_city: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  duration_days: z.number().int().min(0).max(365).optional().nullable(),
  deposit_cents: z.number().int().min(0).optional().nullable(),
  price_from_usd: z.number().min(0).optional().nullable(),
  highlights: z.array(z.string()).max(30).optional().default([]),
  includes: z.array(z.string()).max(50).optional().default([]),
  excludes: z.array(z.string()).max(50).optional().default([]),
  included: z.array(z.string()).max(50).optional(),
  itinerary_outline: z.string().max(5000).optional(),
  badge: z.string().max(100).optional(),
  published: z.boolean().optional().default(false),
  featured: z.boolean().optional().default(false),
});

export const PackageUpdateSchema = PackageCreateSchema.partial();

export const PackageExperienceLinkSchema = z.object({
  package_id: UuidSchema,
  experience_id: UuidSchema,
  is_included: z.boolean().optional().default(false),
  sort_order: z.number().int().min(0).optional().default(0),
});

export const PackageSpecialistLinkSchema = z.object({
  package_id: UuidSchema,
  specialist_id: UuidSchema,
  is_primary: z.boolean().optional().default(false),
});

export type PackageCreate = z.infer<typeof PackageCreateSchema>;
export type PackageUpdate = z.infer<typeof PackageUpdateSchema>;
export type PackageExperienceLink = z.infer<typeof PackageExperienceLinkSchema>;
export type PackageSpecialistLink = z.infer<typeof PackageSpecialistLinkSchema>;
