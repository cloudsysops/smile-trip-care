import { z } from "zod";

const UuidSchema = z.string().uuid();

export const ExperienceCategorySchema = z.enum([
  "nature",
  "culture",
  "adventure",
  "wellness",
  "food",
  "recovery",
  "other",
]);

export const ExperienceCreateSchema = z.object({
  provider_id: UuidSchema.optional().nullable(),
  name: z.string().min(1).max(300),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
  city: z.string().min(1).max(100),
  category: ExperienceCategorySchema.optional().default("other"),
  description: z.string().max(5000).optional(),
  duration_hours: z.number().min(0).max(999).optional().nullable(),
  price_usd: z.number().min(0).optional().nullable(),
  includes: z.array(z.string()).max(50).optional().default([]),
  published: z.boolean().optional().default(false),
});

export const ExperienceUpdateSchema = ExperienceCreateSchema.partial();

export type ExperienceCreate = z.infer<typeof ExperienceCreateSchema>;
export type ExperienceUpdate = z.infer<typeof ExperienceUpdateSchema>;
