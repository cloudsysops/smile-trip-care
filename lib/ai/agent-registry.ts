import { z } from "zod";
import type { ZodType } from "zod";
import {
  LeadTriageOutputSchema,
  SalesResponderOutputSchema,
  ItineraryOutputSchema,
  OpsTasksOutputSchema,
} from "@/lib/ai/schemas";

export type AgentId = "lead-triage" | "sales-responder" | "itinerary-generator" | "ops-coordinator" | "marketing-content";

export interface AgentDef {
  id: AgentId;
  name: string;
  promptPath: string;
  outputSchema: ZodType<unknown>;
  version: string;
}

export const AGENT_REGISTRY: AgentDef[] = [
  {
    id: "lead-triage",
    name: "Lead Triage",
    promptPath: "lead-triage.md",
    outputSchema: LeadTriageOutputSchema,
    version: "1.0",
  },
  {
    id: "sales-responder",
    name: "Sales Responder",
    promptPath: "sales-responder.md",
    outputSchema: SalesResponderOutputSchema,
    version: "1.1",
  },
  {
    id: "itinerary-generator",
    name: "Itinerary Generator",
    promptPath: "itinerary-generator.md",
    outputSchema: ItineraryOutputSchema,
    version: "1.0",
  },
  {
    id: "ops-coordinator",
    name: "Ops Coordinator",
    promptPath: "ops-coordinator.md",
    outputSchema: OpsTasksOutputSchema,
    version: "1.0",
  },
  {
    id: "marketing-content",
    name: "Marketing Content",
    promptPath: "marketing-content.md",
    outputSchema: z.object({ content: z.string().min(1), variants: z.array(z.string()) }).strict(),
    version: "1.0",
  },
];

export function getAgentById(id: AgentId): AgentDef | undefined {
  return AGENT_REGISTRY.find((a) => a.id === id);
}
