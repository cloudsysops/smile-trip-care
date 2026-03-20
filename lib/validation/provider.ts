import { z } from "zod";

const UuidSchema = z.string().uuid();

export const ProviderTypeSchema = z.enum([
  "clinic",
  "specialist",
  "tour_operator",
  "hotel",
  "transport",
  "wellness",
]);
export const ProviderApprovalStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const ProviderCreateSchema = z.object({
  name: z.string().min(1).max(300),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
  provider_type: ProviderTypeSchema.optional(),
  city: z.string().min(1).max(100),
  country: z.string().max(100).optional().default("Colombia"),
  description: z.string().max(5000).optional(),
  contact_email: z.string().email().max(255).optional(),
  contact_phone: z.string().max(50).optional(),
  website: z.string().url().max(500).optional(),
  invited_by_provider_id: UuidSchema.optional(),
  is_family_network: z.boolean().optional().default(false),
  internal_notes: z.string().max(5000).optional(),
  verified: z.boolean().optional().default(false),
  published: z.boolean().optional().default(false),
  approval_status: ProviderApprovalStatusSchema.optional().default("pending"),
});

export const ProviderUpdateSchema = ProviderCreateSchema.partial().extend({
  approved_by: UuidSchema.optional().nullable(),
});

export type ProviderCreate = z.infer<typeof ProviderCreateSchema>;
export type ProviderUpdate = z.infer<typeof ProviderUpdateSchema>;
