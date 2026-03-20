import { getRateLimitProvider } from "@/lib/rate-limit/provider";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

export async function checkRateLimit(key: string): Promise<boolean> {
  const result = await getRateLimitProvider().check(key, {
    windowMs: WINDOW_MS,
    maxRequests: MAX_PER_WINDOW,
  });
  return result.allowed;
}
