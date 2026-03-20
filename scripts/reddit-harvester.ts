import { promises as fs } from "fs";
import path from "path";
import { discoverRedditLeads } from "./growth/reddit-lead-discovery";
import { logger } from "@/lib/logger";

type HarvesterStatus =
  | "discovered"
  | "replied"
  | "assessment_sent"
  | "converted_to_lead"
  | "ignored";

type ExternalLeadRecord = {
  id: string;
  source: string;
  content: string;
  keyword: string;
  status: HarvesterStatus;
  url: string;
  created_at: string;
  score: "high" | "medium" | "low";
  score_reason: string;
};

function computeScore(content: string): { score: "high" | "medium" | "low"; reason: string } {
  const lower = content.toLowerCase();
  const mentionsImplant = lower.includes("implant");
  const mentionsVeneer = lower.includes("veneer");
  const mentionsDentures = lower.includes("denture");
  const mentionsCost =
    lower.includes("cost") ||
    lower.includes("too expensive") ||
    lower.includes("quote") ||
    lower.includes("price");
  const mentionsAbroad =
    lower.includes("abroad") ||
    lower.includes("colombia") ||
    lower.includes("mexico") ||
    lower.includes("medical tourism") ||
    lower.includes("dental tourism");

  if ((mentionsImplant || mentionsVeneer || mentionsDentures) && mentionsCost && mentionsAbroad) {
    return {
      score: "high",
      reason: "Mentions specific treatment (implants/veneers/dentures), cost/price, and abroad/Colombia/Mexico.",
    };
  }
  if ((mentionsImplant || mentionsVeneer || mentionsDentures) && (mentionsCost || mentionsAbroad)) {
    return {
      score: "medium",
      reason: "Mentions treatment interest plus either cost concerns or abroad/medical tourism.",
    };
  }
  if (mentionsImplant || mentionsVeneer || mentionsDentures) {
    return {
      score: "medium",
      reason: "Mentions specific dental treatments but buying signal is weaker.",
    };
  }
  return {
    score: "low",
    reason: "Vague interest; does not clearly combine treatment, cost, and travel.",
  };
}

async function main() {
  logger.info("Running Reddit harvester...");
  const leads = await discoverRedditLeads();
  logger.info(`Discovered ${leads.length} candidate posts from Reddit.`);

  const records: ExternalLeadRecord[] = leads.map((post, index) => {
    // naive keyword extraction: pick first matching keyword in title/summary
    const lower = `${post.post_title} ${post.summary}`.toLowerCase();
    const KEYWORDS = [
      "dental implants",
      "implants",
      "veneers",
      "dentures",
      "dental tourism",
      "implant cost",
      "veneer cost",
    ];
    const keyword =
      KEYWORDS.find((k) => lower.includes(k.toLowerCase())) ?? "[unclassified]";
    const { score, reason } = computeScore(`${post.post_title}\n\n${post.summary}`);

    return {
      id: `reddit-${index}-${Buffer.from(post.post_url).toString("base64").slice(0, 12)}`,
      source: `reddit/r/${post.subreddit}`,
      content: post.summary,
      keyword,
      status: "discovered",
      url: post.post_url,
      created_at: post.created_at,
      score,
      score_reason: reason,
    };
  });

  const dataDir = path.join(process.cwd(), "data");
  const outPath = path.join(dataDir, "external_leads.json");
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(records, null, 2), "utf8");
  logger.info(`Wrote ${records.length} external leads to ${outPath}`);
}

main().catch((err) => {
  console.error("Reddit harvester failed:", err);
  process.exitCode = 1;
});

