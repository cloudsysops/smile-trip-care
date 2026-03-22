import { z } from "zod";

export const HostProfilePatchSchema = z.object({
  display_name: z.string().min(1).max(200).optional(),
  bio: z.string().max(5000).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  whatsapp: z.string().max(50).nullable().optional(),
});

export type HostProfilePatch = z.infer<typeof HostProfilePatchSchema>;
