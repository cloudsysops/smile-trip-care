/**
 * Reddit Lead Discovery — fetches recent posts from target subreddits and filters by keywords.
 * Uses Reddit's public JSON API (no auth required). Set a descriptive User-Agent.
 */

const SUBREDDITS = [
  "dentalimplants",
  "veneers",
  "dentistry",
  "medicaltourism",
  "askdentists",
  "expats",
  "travel",
  "cosmeticsurgery",
] as const;

const KEYWORDS = [
  "implant",
  "implants",
  "veneers",
  "veneer",
  "dentures",
  "hollywood smile",
  "dentist cost",
  "dental cost",
  "too expensive",
  "price quote",
  "dental tourism",
  "teeth abroad",
  "colombia",
  "mexico",
  "abroad",
];

export type RedditLeadPost = {
  post_title: string;
  post_url: string;
  subreddit: string;
  author: string;
  created_at: string; // ISO
  summary: string;
};

type RedditListingChild = {
  data?: {
    title?: string;
    selftext?: string;
    url?: string;
    subreddit?: string;
    author?: string;
    created_utc?: number;
    permalink?: string;
  };
};

const USER_AGENT = "MedVoyageSmile-Growth/1.0 (Lead discovery; contact for questions)";

function matchesKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return KEYWORDS.some((k) => lower.includes(k.toLowerCase()));
}

function toSummary(title: string, selftext: string): string {
  const t = (title || "").trim();
  const s = (selftext || "").trim().slice(0, 500);
  if (!s) return t || "No content";
  return `${t}\n\n${s}`.trim();
}

async function fetchSubredditNew(subreddit: string): Promise<RedditLeadPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=25`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return [];
  const json = (await res.json().catch(() => null)) as { data?: { children?: RedditListingChild[] } } | null;
  const children = json?.data?.children ?? [];
  const out: RedditLeadPost[] = [];
  for (const c of children) {
    const d = c?.data;
    if (!d?.title) continue;
    const title = String(d.title);
    const selftext = typeof d.selftext === "string" ? d.selftext : "";
    const combined = `${title} ${selftext}`;
    if (!matchesKeywords(combined)) continue;
    const created_at = d.created_utc
      ? new Date(d.created_utc * 1000).toISOString()
      : new Date().toISOString();
    let post_url = "";
    if (d.permalink) {
      const prefix = d.permalink.startsWith("/") ? "" : "/";
      post_url = `https://www.reddit.com${prefix}${d.permalink}`;
    } else if (typeof d.url === "string") {
      post_url = d.url;
    }
    if (!post_url) post_url = `https://www.reddit.com/r/${subreddit}`;
    out.push({
      post_title: title,
      post_url,
      subreddit: typeof d.subreddit === "string" ? d.subreddit : subreddit,
      author: typeof d.author === "string" ? d.author : "[unknown]",
      created_at,
      summary: toSummary(title, selftext),
    });
  }
  return out;
}

/**
 * Fetch recent posts from all target subreddits and return those matching keywords.
 * Deduplicated by post_url; sorted by created_at descending.
 */
export async function discoverRedditLeads(): Promise<RedditLeadPost[]> {
  const all: RedditLeadPost[] = [];
  for (const sub of SUBREDDITS) {
    try {
      const posts = await fetchSubredditNew(sub);
      all.push(...posts);
    } catch {
      // skip subreddit on error
    }
  }
  const seen = new Set<string>();
  const deduped = all.filter((p) => {
    const key = p.post_url || `${p.subreddit}:${p.post_title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  deduped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return deduped;
}
