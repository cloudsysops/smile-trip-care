type OpenAIMessage = {
  role: "system" | "user";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

export type CallAgentArgs = {
  agentName: string;
  systemPrompt: string;
  userJson: unknown;
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

async function runChatCompletion(messages: OpenAIMessage[], withResponseFormat: boolean): Promise<string> {
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

  const json = await response.json().catch(() => ({} as ChatCompletionResponse));
  if (!response.ok) {
    const message = (json as ChatCompletionResponse)?.error?.message ?? `OpenAI API error (${response.status})`;
    throw new Error(message);
  }

  const content = (json as ChatCompletionResponse)?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI returned empty content");
  }
  return content;
}

export async function callAgent({ agentName, systemPrompt, userJson }: CallAgentArgs): Promise<unknown> {
  const userMessage = JSON.stringify(userJson);
  const messages: OpenAIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  let content = "";
  try {
    content = await runChatCompletion(messages, true);
  } catch {
    content = await runChatCompletion(messages, false);
  }

  try {
    return JSON.parse(extractJsonText(content));
  } catch (err) {
    throw new Error(`Failed to parse JSON for ${agentName}: ${String(err)}`);
  }
}
