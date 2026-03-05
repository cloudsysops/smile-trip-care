import { getRateLimitProvider } from "@/lib/rate-limit/provider";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

export function checkRateLimit(key: string): boolean {
  const result = getRateLimitProvider().check(key, {
    windowMs: WINDOW_MS,
    maxRequests: MAX_PER_WINDOW,
  });
  return result.allowed;
}
