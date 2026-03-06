import { z } from "zod";

export const LeadCreateSchema = z.object({
  first_name: z.string().min(1).max(200),
  last_name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  package_slug: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
  /** Honeypot: allow values and silently drop bot-like submissions in handler. */
  company_website: z.string().max(500).optional(),
});

export type LeadCreate = z.infer<typeof LeadCreateSchema>;
