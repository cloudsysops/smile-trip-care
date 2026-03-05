import { z } from "zod";

export const ASSET_CATEGORIES = ["clinic", "finca", "lodging", "tour", "team", "other"] as const;
export const ASSET_LOCATIONS = ["Medellín", "Manizales", "Other"] as const;

export const AssetCategorySchema = z.enum(ASSET_CATEGORIES);
export const AssetLocationSchema = z.enum(ASSET_LOCATIONS);

export const AssetMetadataSchema = z.object({
  title: z.string().min(1).max(300),
  category: AssetCategorySchema,
  location: AssetLocationSchema,
  tags: z.array(z.string().min(1).max(50)).default([]),
  alt_text: z.string().min(1).max(500),
  source_url: z.string().url().optional(),
});

export const AssetUpdateSchema = AssetMetadataSchema.partial().extend({
  approved: z.boolean().optional(),
  published: z.boolean().optional(),
});

export const AssetFilterSchema = z.object({
  category: AssetCategorySchema.optional(),
  location: AssetLocationSchema.optional(),
  approved: z.boolean().optional(),
  published: z.boolean().optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const AssetUploadSchema = z.object({
  title: z.string().min(1).max(300),
  category: AssetCategorySchema,
  location: AssetLocationSchema,
  tags: z.string().max(500).transform((s) => s.split(",").map((t) => t.trim()).filter(Boolean)),
  alt_text: z.string().min(1).max(500),
  source_url: z.string().url().max(2000).optional().or(z.literal("")),
});

export type AssetUploadInput = z.infer<typeof AssetUploadSchema>;
export type AssetUpdateInput = z.infer<typeof AssetUpdateSchema>;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export function validateAssetFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Only JPEG, PNG, and WebP are allowed" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File must be 8MB or smaller" };
  }
  return { ok: true };
}
