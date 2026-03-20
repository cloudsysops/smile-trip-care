import { getAgentById, type AgentId } from "@/lib/ai/agent-registry";
import { loadAgentPrompt } from "@/lib/ai/agent-loader";
import { runChatJson } from "@/lib/ai/openai";
import type { ZodType } from "zod";

export type RunAgentContext = {
  requestId?: string;
};

export type RunAgentResult<T = unknown> = {
  output: T;
  raw: string;
  model: string;
  tokens?: { total?: number; prompt?: number; completion?: number };
  request_id?: string;
};

/**
 * Run an agent: validate input, load prompt, call OpenAI, parse and validate output with Zod.
 * Throws on validation failure or API error.
 */
export async function runAgent<T = unknown>(
  agentId: AgentId,
  input: unknown,
  context: RunAgentContext = {}
): Promise<RunAgentResult<T>> {
  const { requestId } = context;
  const agent = getAgentById(agentId);
  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  const schema = agent.outputSchema as ZodType<T>;
  const systemPrompt = await loadAgentPrompt(agentId);
  const result = await runChatJson({
    systemPrompt,
    userJson: input,
    requestId,
  });

  const parsed = schema.safeParse(result.json);
  if (!parsed.success) {
    throw new Error(
      `Agent ${agentId} output validation failed: ${JSON.stringify(parsed.error.flatten())}`
    );
  }

  return {
    output: parsed.data,
    raw: result.raw,
    model: result.model,
    tokens: result.tokens,
    request_id: requestId,
  };
}
