import { generateSuggestedReply } from "@/lib/growth/aiResponder";
import { generateText } from "./provider";

export type AiReplyResult = Readonly<{
  reply: string;
  fallbackUsed: boolean;
  fallbackReason?: string;
}>;

function buildPrompt(postText: string, keyword?: string): string {
  const trimmed = postText.trim();
  const keywordText = keyword ? `\nDetected keyword or topic hint: "${keyword}".` : "";

  return [
    "You are helping an operator reply to a potential dental tourism patient on Reddit or a similar forum.",
    "Write a short, empathetic, non-spammy reply that:",
    "- acknowledges their situation and cost concerns,",
    "- briefly explains that high-quality dental care is available in Colombia at lower cost,",
    "- invites them to take a free smile assessment on our site,",
    "- does NOT give medical advice or guarantee outcomes,",
    "- stays under 6 sentences.",
    "",
    "Always end the message with a clear call to action that points them to our free assessment at this URL:",
    "https://smile-transformation-platform-dev.vercel.app/assessment",
    "",
    "Write in clear, neutral English. Do not include markdown or bullet points; just plain text.",
    "",
    "Here is the original post text:",
    trimmed || "[No additional context provided]",
    keywordText,
  ].join("\n");
}

/**
 * Generate a helpful outreach reply for the harvester.
 * - Tries the AI provider first.
 * - Falls back to the existing deterministic helper if provider is unavailable or fails.
 */
export async function generateAiReplyForHarvester(
  postText: string,
  keyword?: string,
): Promise<AiReplyResult> {
  const prompt = buildPrompt(postText, keyword);

  const providerResult = await generateText(prompt, {
    temperature: 0.4,
    maxTokens: 240,
  });

  if (providerResult.ok && providerResult.text) {
    return {
      reply: providerResult.text,
      fallbackUsed: false,
    };
  }

  // Fallback: deterministic helper used today in the UI.
  const fallback = generateSuggestedReply(postText, keyword);
  return {
    reply: fallback,
    fallbackUsed: true,
    fallbackReason: providerResult.fallbackReason ?? "Provider unavailable",
  };
}

