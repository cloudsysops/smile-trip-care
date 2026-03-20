export const LOCAL_APP_ORIGIN_FALLBACK = "http://localhost:3000";
export const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
export const RESEND_EMAILS_API_URL = "https://api.resend.com/emails";
export const REDDIT_BASE_URL = "https://www.reddit.com";
export const WHATSAPP_BASE_URL = "https://wa.me";

export function getSiteOriginFromEnv(): string {
  if (typeof process.env.NEXT_PUBLIC_SITE_URL === "string" && process.env.NEXT_PUBLIC_SITE_URL.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "");
  }
  return LOCAL_APP_ORIGIN_FALLBACK;
}
