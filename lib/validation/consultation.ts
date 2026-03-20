import { z } from "zod";

const UuidSchema = z.string().uuid();

export const ConsultationStatusSchema = z.enum([
  "requested",
  "scheduled",
  "completed",
  "cancelled",
]);

export const ConsultationCreateSchema = z.object({
  lead_id: UuidSchema,
  specialist_id: UuidSchema,
  status: ConsultationStatusSchema.optional().default("requested"),
  scheduled_at: z.coerce.date().optional().nullable(),
  scheduled_date: z.string().optional().nullable(),
  scheduled_time: z.string().optional().nullable(),
  notes: z.string().max(2000).optional(),
});

export const ConsultationUpdateSchema = z.object({
  status: ConsultationStatusSchema.optional(),
  scheduled_at: z.coerce.date().optional().nullable(),
  scheduled_date: z.string().optional().nullable(),
  scheduled_time: z.string().optional().nullable(),
  notes: z.string().max(2000).optional(),
});

export type ConsultationCreate = z.infer<typeof ConsultationCreateSchema>;
export type ConsultationUpdate = z.infer<typeof ConsultationUpdateSchema>;
