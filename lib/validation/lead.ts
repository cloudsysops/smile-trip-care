import { z } from "zod";

const OptionalTrackingValueSchema = z.string().trim().min(1).max(150).optional();

export const LeadCreateSchema = z.object({
  first_name: z.string().min(1).max(200),
  last_name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  country: z.string().max(100).optional(),
  package_slug: z.string().max(100).optional(),
  message: z.string().max(2000).optional(),
  utm_source: OptionalTrackingValueSchema,
  utm_medium: OptionalTrackingValueSchema,
  utm_campaign: OptionalTrackingValueSchema,
  utm_term: OptionalTrackingValueSchema,
  utm_content: OptionalTrackingValueSchema,
  landing_path: z.string().trim().min(1).max(1000).optional(),
  referrer_url: z.string().url().max(2000).optional(),
  /** Honeypot: allow values and silently drop bot-like submissions in handler. */
  company_website: z.string().max(500).optional(),
});

export type LeadCreate = z.infer<typeof LeadCreateSchema>;
