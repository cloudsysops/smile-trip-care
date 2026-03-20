import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config();

const apiKey = process.env.ANTHROPIC_API_KEY;

function requireApiKey() {
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error(
      "Missing ANTHROPIC_API_KEY. Set it in the .env file (e.g. ANTHROPIC_API_KEY=...)."
    );
  }
  return apiKey.trim();
}

const anthropic = new Anthropic({
  apiKey: requireApiKey(),
});

const MODEL = "claude-3-sonnet-20240229";

function toTextContent(text) {
  return [{ type: "text", text }];
}

/**
 * Send a single user message to Claude.
 *
 * @param {Object} params
 * @param {string} params.message - User message
 * @param {string=} params.system - Optional system prompt
 * @param {number=} params.maxTokens - Optional max tokens
 * @param {number=} params.temperature - Optional temperature
 * @returns {Promise<string>} Assistant text
 */
export async function sendClaudeMessage({
  message,
  system,
  maxTokens = 1024,
  temperature = 0.2,
}) {
  if (!message || typeof message !== "string") {
    throw new TypeError("sendClaudeMessage: `message` must be a non-empty string.");
  }

  try {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      system: system || undefined,
      messages: [
        {
          role: "user",
          content: toTextContent(message),
        },
      ],
    });

    const text =
      resp?.content
        ?.map((c) => (c?.type === "text" ? c.text : ""))
        .join("") ?? "";

    return text.trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Claude request failed (sendClaudeMessage): ${msg}`);
  }
}

/**
 * Conversational chat with history maintained by the caller.
 *
 * Caller passes `history`. This function returns:
 * - reply (assistant text)
 * - history (updated history including new user + assistant turns)
 *
 * @param {Object} params
 * @param {string} params.userMessage
 * @param {{role: "user"|"assistant", content: string}[]=} params.history
 * @param {string=} params.system
 * @param {number=} params.maxTokens
 * @param {number=} params.temperature
 * @returns {Promise<{reply: string, history: {role:"user"|"assistant", content:string}[]}>}
 */
export async function chatClaude({
  userMessage,
  history = [],
  system,
  maxTokens = 1024,
  temperature = 0.2,
}) {
  if (!userMessage || typeof userMessage !== "string") {
    throw new TypeError("chatClaude: `userMessage` must be a non-empty string.");
  }

  if (!Array.isArray(history)) {
    throw new TypeError("chatClaude: `history` must be an array.");
  }

  const messages = history.map((turn) => {
    if (
      !turn ||
      (turn.role !== "user" && turn.role !== "assistant") ||
      typeof turn.content !== "string"
    ) {
      throw new TypeError(
        "chatClaude: each history item must be { role: 'user'|'assistant', content: string }."
      );
    }

    return {
      role: turn.role,
      content: toTextContent(turn.content),
    };
  });

  // Append current user message
  messages.push({
    role: "user",
    content: toTextContent(userMessage),
  });

  try {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      temperature,
      system: system || undefined,
      messages,
    });

    const reply =
      resp?.content
        ?.map((c) => (c?.type === "text" ? c.text : ""))
        .join("") ?? "";

    const replyTrimmed = reply.trim();

    const nextHistory = [
      ...history,
      { role: "user", content: userMessage },
      { role: "assistant", content: replyTrimmed },
    ];

    return { reply: replyTrimmed, history: nextHistory };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Claude request failed (chatClaude): ${msg}`);
  }
}

