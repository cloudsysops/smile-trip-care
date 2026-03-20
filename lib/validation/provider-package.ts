import { z } from "zod";

/**
 * Fields provider managers may update on their own packages (no slug / provider_id changes).
 * Intentionally explicit to avoid Zod defaults from the admin package schema overwriting data.
 */
export const ProviderPackagePatchSchema = z
  .object({
    id: z.string().uuid(),
    published: z.boolean().optional(),
    name: z.string().min(1).max(300).optional(),
    description: z.string().max(5000).optional().nullable(),
    title: z.string().max(300).optional().nullable(),
    subtitle: z.string().max(500).optional().nullable(),
    location: z.string().max(100).optional().nullable(),
    origin_city: z.string().max(100).optional().nullable(),
    destination_city: z.string().max(100).optional().nullable(),
    recovery_city: z.string().max(100).optional().nullable(),
    deposit_cents: z.number().int().min(0).optional().nullable(),
    duration_days: z.number().int().min(0).max(365).optional().nullable(),
    itinerary_outline: z.string().max(5000).optional().nullable(),
    featured: z.boolean().optional(),
    price_from_usd: z.number().min(0).optional().nullable(),
    price_cents: z.number().int().min(0).optional().nullable(),
    badge: z.string().max(100).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const { id: _id, ...rest } = data;
    void _id;
    const keys = Object.keys(rest).filter((k) => rest[k as keyof typeof rest] !== undefined);
    if (keys.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one field to update is required" });
    }
  });

export type ProviderPackagePatch = z.infer<typeof ProviderPackagePatchSchema>;
