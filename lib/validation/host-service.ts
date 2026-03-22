import { z } from "zod";

export const HostServiceCategorySchema = z.enum([
  "lodging",
  "transport",
  "experience",
  "therapy",
  "accompaniment",
  "other",
]);

export const HostServicePricePerSchema = z.enum(["person", "group", "day", "session", "transfer"]);

export const HostServiceCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(8000).optional().nullable(),
  category: HostServiceCategorySchema,
  price_cents: z.number().int().min(0),
  price_per: HostServicePricePerSchema.optional().default("person"),
  city: z.string().max(200).optional().nullable(),
  duration_hours: z.number().min(0).max(1000).optional().nullable(),
  max_capacity: z.number().int().min(1).max(500).optional().nullable(),
});

export type HostServiceCreateInput = z.infer<typeof HostServiceCreateSchema>;
