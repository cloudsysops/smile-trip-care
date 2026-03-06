import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().startsWith("sk-").optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
  AUTOMATION_CRON_SECRET: z.string().min(16).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  OUTBOUND_EMAIL_FROM: z.string().email().optional(),
  OUTBOUND_WHATSAPP_API_URL: z.string().url().optional(),
  OUTBOUND_WHATSAPP_API_TOKEN: z.string().min(1).optional(),
});

export type ServerConfig = z.infer<typeof serverSchema>;

function parse(): z.SafeParseReturnType<unknown, ServerConfig> {
  return serverSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    AUTOMATION_CRON_SECRET: process.env.AUTOMATION_CRON_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    OUTBOUND_EMAIL_FROM: process.env.OUTBOUND_EMAIL_FROM,
    OUTBOUND_WHATSAPP_API_URL: process.env.OUTBOUND_WHATSAPP_API_URL,
    OUTBOUND_WHATSAPP_API_TOKEN: process.env.OUTBOUND_WHATSAPP_API_TOKEN,
  });
}

/** Validated server config. Use only in server code. Throws if invalid. */
export function getServerConfig(): ServerConfig {
  const out = parse();
  if (!out.success) {
    throw new Error(`Invalid server config: ${JSON.stringify(out.error.flatten())}`);
  }
  return out.data;
}

/** Safe parse; use when vars are optional (e.g. build time). */
export function getServerConfigSafe() {
  return parse();
}
