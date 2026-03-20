import { z } from "zod";

const UuidSchema = z.string().uuid();

export const SpecialistApprovalStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "suspended",
]);

export const SpecialistCreateSchema = z.object({
  provider_id: UuidSchema.optional().nullable(),
  name: z.string().min(1).max(300),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
  specialty: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  clinic_name: z.string().max(200).optional(),
  bio: z.string().max(10000).optional(),
  photo_asset_id: UuidSchema.optional().nullable(),
  free_evaluation: z.boolean().optional().default(true),
  recommended_by_provider_id: UuidSchema.optional().nullable(),
  approval_status: SpecialistApprovalStatusSchema.optional().default("pending"),
  published: z.boolean().optional().default(false),
});

export const SpecialistUpdateSchema = SpecialistCreateSchema.partial();

export type SpecialistCreate = z.infer<typeof SpecialistCreateSchema>;
export type SpecialistUpdate = z.infer<typeof SpecialistUpdateSchema>;
