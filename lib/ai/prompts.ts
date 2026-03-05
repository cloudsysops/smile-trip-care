import { readFile } from "node:fs/promises";
import path from "node:path";

export type AgentName = "lead-triage" | "sales-responder" | "itinerary-generator";

const promptFiles: Record<AgentName, string> = {
  "lead-triage": "lead-triage.md",
  "sales-responder": "sales-responder.md",
  "itinerary-generator": "itinerary-generator.md",
};

const cache = new Map<AgentName, string>();

function globalSafetyFooter(): string {
  return [
    "",
    "Global policy (must follow):",
    "- Return strict JSON only. No markdown, no code fences, no explanations outside JSON.",
    "- No medical advice, diagnosis, treatment instructions, or guaranteed outcomes.",
    "- If key info is missing, ask up to 3 targeted questions and still provide best-effort output.",
  ].join("\n");
}

export async function getAgentSystemPrompt(agentName: AgentName): Promise<string> {
  const cached = cache.get(agentName);
  if (cached) return cached;

  const fileName = promptFiles[agentName];
  const absolute = path.join(process.cwd(), "agents", fileName);
  const basePrompt = await readFile(absolute, "utf8");
  const fullPrompt = `${basePrompt.trim()}\n${globalSafetyFooter()}`;
  cache.set(agentName, fullPrompt);
  return fullPrompt;
}
