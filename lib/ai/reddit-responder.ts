/**
 * AI responder for Reddit posts: generates a short, helpful reply that ends with the assessment CTA.
 */

import { runChatJson } from "@/lib/ai/openai";
import { getSiteOriginFromEnv } from "@/lib/config/urls";

const siteOrigin = getSiteOriginFromEnv();

const ASSESSMENT_URL = process.env.NEXT_PUBLIC_ASSESSMENT_URL ?? `${siteOrigin}/assessment`;

const SYSTEM_PROMPT = `You are a helpful, non-salesy advisor for people researching dental treatment and dental tourism.

Given a Reddit post (title and summary), write a short, genuine reply (2–4 sentences) that:
- Acknowledges their question or situation
- Offers one concrete, useful point (e.g. cost comparison, what to look for, timing)
- Does NOT sound like an ad or pitch
- Ends with exactly this line (keep the URL as-is):

If you're exploring treatment abroad, you can estimate options here:
${ASSESSMENT_URL}

Rules:
- No placeholders. Use the exact CTA line above.
- Be concise and human. No fluff or marketing speak.

Return a JSON object with a single key "reply" (string) containing your full reply.`;

export type RedditResponderInput = {
  post_title: string;
  summary: string;
};

/**
 * Generate a reply for a Reddit post. Returns null if OpenAI is unavailable or fails.
 */
export async function generateRedditReply(input: RedditResponderInput): Promise<string | null> {
  try {
    const result = await runChatJson({
      systemPrompt: SYSTEM_PROMPT,
      userJson: {
        post_title: input.post_title,
        summary: input.summary.slice(0, 2000),
      },
    });
    const raw = result.json as { reply?: string; message?: string } | string | null;
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    let text: string | null = null;
    if (raw && typeof raw === "object") {
      if (typeof raw.reply === "string") text = raw.reply;
      else if (typeof raw.message === "string") text = raw.message;
    }
    if (text?.trim()) return text.trim();
    return null;
  } catch {
    return null;
  }
}
