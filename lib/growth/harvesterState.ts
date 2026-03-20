/**
 * File-based state for harvester "Mark replied" (Phase 1.5).
 * No DB schema; state lives in data/harvester_state.json.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const FILENAME = "harvester_state.json";

function getFilePath(): string {
  return path.join(process.cwd(), "data", FILENAME);
}

export type HarvesterRepliedState = Record<string, boolean>;

export async function readHarvesterRepliedState(): Promise<HarvesterRepliedState> {
  try {
    const filePath = getFilePath();
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      const out: HarvesterRepliedState = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof k === "string" && v === true) out[k] = true;
      }
      return out;
    }
  } catch {
    // file missing or invalid
  }
  return {};
}

export async function writeHarvesterMarkReplied(
  id: string,
  replied: boolean,
): Promise<void> {
  const filePath = getFilePath();
  const dataDir = path.dirname(filePath);
  await fs.mkdir(dataDir, { recursive: true });

  const current = await readHarvesterRepliedState();
  if (replied) {
    current[id] = true;
  } else {
    delete current[id];
  }
  await fs.writeFile(filePath, JSON.stringify(current, null, 0), "utf8");
}
