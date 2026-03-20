import { readFile } from "node:fs/promises";
import path from "node:path";
import type { AgentId } from "@/lib/ai/agent-registry";
import { getAgentById } from "@/lib/ai/agent-registry";

const cache = new Map<AgentId, string>();

const GLOBAL_SAFETY_FOOTER = [
  "",
  "Global policy (must follow):",
  "- Return strict JSON only. No markdown, no code fences, no explanations outside JSON.",
  "- No medical advice, diagnosis, treatment instructions, or guaranteed outcomes.",
  "- If key info is missing, ask targeted questions in output; use only provided input and known constants.",
].join("\n");

/**
 * Load agent prompt from filesystem (server-only). Results are cached in memory.
 */
export async function loadAgentPrompt(agentId: AgentId): Promise<string> {
  const cached = cache.get(agentId);
  if (cached) return cached;

  const agent = getAgentById(agentId);
  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  const absolute = path.join(process.cwd(), "agents", agent.promptPath);
  const basePrompt = await readFile(absolute, "utf8");
  const fullPrompt = `${basePrompt.trim()}\n${GLOBAL_SAFETY_FOOTER}`;
  cache.set(agentId, fullPrompt);
  return fullPrompt;
}
