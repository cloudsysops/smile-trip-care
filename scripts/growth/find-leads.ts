#!/usr/bin/env node
/**
 * CLI: discover Reddit leads and optionally generate AI reply drafts.
 * Usage: npm run growth:leads
 * Writes data/reddit-leads.json (top 10 posts + optional draft_reply per post).
 */

import { discoverRedditLeads } from "./reddit-lead-discovery";
import { generateRedditReply } from "../../lib/ai/reddit-responder";
import { logger } from "@/lib/logger";
import * as fs from "fs";
import * as path from "path";

const TOP_N = 10;
const DATA_DIR = path.join(process.cwd(), "data");
const OUTPUT_FILE = path.join(DATA_DIR, "reddit-leads.json");

type OutputPost = {
  post_title: string;
  post_url: string;
  subreddit: string;
  author: string;
  created_at: string;
  summary: string;
  draft_reply?: string | null;
};

async function main() {
  logger.info("Discovering Reddit leads...");
  const posts = await discoverRedditLeads();
  const top = posts.slice(0, TOP_N);
  logger.info(`Found ${posts.length} matching posts. Top ${top.length}:\n`);

  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const output: OutputPost[] = [];

  for (let i = 0; i < top.length; i++) {
    const p = top[i];
    logger.info(`${i + 1}. [r/${p.subreddit}] ${p.post_title.slice(0, 60)}...`);
    const row: OutputPost = {
      post_title: p.post_title,
      post_url: p.post_url,
      subreddit: p.subreddit,
      author: p.author,
      created_at: p.created_at,
      summary: p.summary,
    };
    if (hasOpenAI) {
      try {
        const reply = await generateRedditReply({ post_title: p.post_title, summary: p.summary });
        row.draft_reply = reply ?? null;
      } catch {
        row.draft_reply = null;
      }
    }
    output.push(row);
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf8");
  logger.info(`\nWrote ${output.length} leads to ${OUTPUT_FILE}`);
  if (!hasOpenAI) {
    logger.info("Set OPENAI_API_KEY to generate draft replies.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
