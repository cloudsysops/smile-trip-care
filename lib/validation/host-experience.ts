import { z } from "zod";
import { ExperienceCategorySchema } from "@/lib/validation/experience";

export const HostExperienceCreateSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(5000).nullable().optional(),
  category: ExperienceCategorySchema.optional().default("other"),
  base_price_cents: z.number().int().min(0),
  city: z.string().min(1).max(100),
  published: z.boolean().optional().default(false),
});

export const HostExperiencePatchSchema = HostExperienceCreateSchema.partial().extend({
  published: z.boolean().optional(),
});

export type HostExperienceCreate = z.infer<typeof HostExperienceCreateSchema>;
export type HostExperiencePatch = z.infer<typeof HostExperiencePatchSchema>;
