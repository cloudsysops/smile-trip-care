import { loadAgentPrompt } from "@/lib/ai/agent-loader";
import type { AgentId } from "@/lib/ai/agent-registry";
import { SalesResponderOutputSchema } from "@/lib/ai/schemas";
import type { LeadTriageOutput, SalesResponderOutput } from "@/lib/ai/schemas";

type OpenAIMessage = {
  role: "system" | "user";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string | null };
    usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  }>;
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
};

export type CallAgentArgs = {
  agentName: string;
  systemPrompt: string;
  userJson: unknown;
};

export type SalesResponderInput = {
  lead: {
    name: string;
    email: string;
    phone: string | null;
    country: string | null;
    package_slug: string | null;
    notes: string | null;
  };
  triage: LeadTriageOutput | null;
  cta_url: string;
};

export type RunChatJsonResult = {
  json: unknown;
  raw: string;
  model: string;
  tokens?: { total?: number; prompt?: number; completion?: number };
};

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1).trim();
  }
  throw new Error("Model did not return JSON content");
}

async function runChatCompletion(
  messages: OpenAIMessage[],
  withResponseFormat: boolean
): Promise<{ content: string; usage?: ChatCompletionResponse["usage"] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY missing");
  }
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const payload: Record<string, unknown> = {
    model,
    temperature: 0.2,
    messages,
  };
  if (withResponseFormat) {
    payload.response_format = { type: "json_object" };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const json = (await response.json().catch(() => ({}))) as ChatCompletionResponse;
  if (!response.ok) {
    const message = json?.error?.message ?? `OpenAI API error (${response.status})`;
    throw new Error(message);
  }

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI returned empty content");
  }
  const usage = json?.usage ?? json?.choices?.[0]?.usage;
  return { content, usage };
}

/**
 * Request JSON-only output from OpenAI. Retries once without response_format if first attempt fails to parse.
 */
export async function runChatJson(params: {
  systemPrompt: string;
  userJson: unknown;
  requestId?: string;
}): Promise<RunChatJsonResult> {
  const { systemPrompt, userJson } = params;
  const userMessage = typeof userJson === "string" ? userJson : JSON.stringify(userJson);
  const messages: OpenAIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  let content = "";
  let usage: RunChatJsonResult["tokens"];
  try {
    const out = await runChatCompletion(messages, true);
    content = out.content;
    if (out.usage) {
      usage = {
        total: out.usage.total_tokens,
        prompt: out.usage.prompt_tokens,
        completion: out.usage.completion_tokens,
      };
    }
  } catch {
    const out = await runChatCompletion(messages, false);
    content = out.content;
    if (out.usage) {
      usage = {
        total: out.usage.total_tokens,
        prompt: out.usage.prompt_tokens,
        completion: out.usage.completion_tokens,
      };
    }
  }

  try {
    const json = JSON.parse(extractJsonText(content));
    return {
      json,
      raw: content,
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      tokens: usage,
    };
  } catch (err) {
    throw new Error(`Failed to parse JSON from model: ${String(err)}`);
  }
}

export async function callAgent({ agentName, systemPrompt, userJson }: CallAgentArgs): Promise<unknown> {
  try {
    const result = await runChatJson({ systemPrompt, userJson });
    return result.json;
  } catch (err) {
    throw new Error(`Failed to parse JSON for ${agentName}: ${String(err)}`);
  }
}

export async function callSalesResponder(input: SalesResponderInput): Promise<SalesResponderOutput> {
  const systemPrompt = await loadAgentPrompt("sales-responder" as AgentId);
  const raw = await callAgent({
    agentName: "sales-responder",
    systemPrompt,
    userJson: input,
  });
  const parsed = SalesResponderOutputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid sales-responder output: ${JSON.stringify(parsed.error.flatten())}`);
  }
  return parsed.data;
}
