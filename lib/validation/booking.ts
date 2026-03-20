import { z } from "zod";

const UuidSchema = z.string().uuid();

export const BookingStatusSchema = z.enum([
  "draft",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "pending",
  "deposit_paid",
]);

export const BookingCreateSchema = z.object({
  lead_id: UuidSchema,
  package_id: UuidSchema,
  provider_id: UuidSchema.optional().nullable(),
  status: BookingStatusSchema.optional().default("draft"),
  total_price_usd: z.number().min(0).optional().nullable(),
  deposit_paid: z.boolean().optional().default(false),
  deposit_cents: z.number().int().min(0).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  notes: z.string().max(5000).optional(),
});

export const BookingUpdateSchema = z.object({
  status: BookingStatusSchema.optional(),
  total_price_usd: z.number().min(0).optional().nullable(),
  deposit_paid: z.boolean().optional(),
  deposit_cents: z.number().int().min(0).optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  notes: z.string().max(5000).optional(),
  provider_id: UuidSchema.optional().nullable(),
});

export type BookingCreate = z.infer<typeof BookingCreateSchema>;
export type BookingUpdate = z.infer<typeof BookingUpdateSchema>;
