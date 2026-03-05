import { z } from "zod";

export const ASSET_CATEGORIES = ["clinic", "finca", "lodging", "tour", "team", "other"] as const;
export const ASSET_LOCATIONS = ["Medellín", "Manizales", "Other"] as const;

export const AssetUploadSchema = z.object({
  title: z.string().min(1).max(300),
  category: z.enum(ASSET_CATEGORIES),
  location: z.enum(ASSET_LOCATIONS),
  tags: z.string().max(500).transform((s) => s.split(",").map((t) => t.trim()).filter(Boolean)),
  alt_text: z.string().min(1).max(500),
  source_url: z.string().url().max(2000).optional().or(z.literal("")),
});

export const AssetUpdateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  category: z.enum(ASSET_CATEGORIES).optional(),
  location: z.enum(ASSET_LOCATIONS).optional(),
  tags: z.array(z.string().max(100)).optional(),
  alt_text: z.string().min(1).max(500).optional(),
  source_url: z.string().url().max(2000).optional().nullable(),
  approved: z.boolean().optional(),
  published: z.boolean().optional(),
});

export type AssetUploadInput = z.infer<typeof AssetUploadSchema>;
export type AssetUpdateInput = z.infer<typeof AssetUpdateSchema>;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export function validateAssetFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Only JPEG, PNG, and WebP are allowed" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File must be 8MB or smaller" };
  }
  return { ok: true };
}
