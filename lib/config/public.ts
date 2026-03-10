import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

export type PublicConfig = z.infer<typeof publicSchema>;

function parse(): z.SafeParseReturnType<unknown, PublicConfig> {
  return publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
}

/** Validated public config. Safe at build time (all fields optional). */
export function getPublicConfig(): PublicConfig {
  const out = parse();
  if (!out.success) {
    throw new Error(`Invalid public config: ${JSON.stringify(out.error.flatten())}`);
  }
  return out.data;
}
