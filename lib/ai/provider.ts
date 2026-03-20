import { createLogger } from "@/lib/logger";

const DEFAULT_MODEL = "gpt-4.1-mini";

type GenerateTextOptions = Readonly<{
  model?: string;
  temperature?: number;
  maxTokens?: number;
}>;

export type GenerateTextResult = Readonly<{
  ok: boolean;
  text: string | null;
  fallbackReason?: string;
}>;

/**
 * Thin wrapper around an LLM provider (OpenAI-compatible).
 * - Reads OPENAI_API_KEY from env.
 * - Fails safely and returns a fallback result when misconfigured or on error.
 * - Never throws for caller; logs internal errors via logger.
 */
export async function generateText(
  prompt: string,
  options?: GenerateTextOptions,
): Promise<GenerateTextResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      text: null,
      fallbackReason: "OPENAI_API_KEY not configured",
    };
  }

  const requestId = crypto.randomUUID();
  const log = createLogger(requestId);

  const model = options?.model ?? DEFAULT_MODEL;
  const temperature = options?.temperature ?? 0.4;
  const maxTokens = options?.maxTokens ?? 320;

  const body = {
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a concise assistant helping write short, empathetic outreach messages for dental tourism. Keep replies under 6 sentences, avoid medical advice, and never promise specific clinical outcomes.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature,
    max_tokens: maxTokens,
  };

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    log.error("AI provider request failed", { error });
    return {
      ok: false,
      text: null,
      fallbackReason: "Network or provider error",
    };
  }

  if (!response.ok) {
    let errorText: string | undefined;
    try {
      errorText = await response.text();
    } catch {
      // ignore parse error
    }
    log.error("AI provider responded with non-2xx status", {
      status: response.status,
      body: errorText,
    });
    return {
      ok: false,
      text: null,
      fallbackReason: `Provider HTTP ${response.status}`,
    };
  }

  try {
    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const first = json.choices?.[0]?.message?.content?.trim();
    if (!first) {
      return {
        ok: false,
        text: null,
        fallbackReason: "Empty response from provider",
      };
    }
    return { ok: true, text: first };
  } catch (error) {
    log.error("Failed to parse AI provider response", { error });
    return {
      ok: false,
      text: null,
      fallbackReason: "Failed to parse provider response",
    };
  }
}

