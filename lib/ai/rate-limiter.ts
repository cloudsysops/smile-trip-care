export type RequestLog = Readonly<{
  timestamp: number;
  userId?: string;
}>;

export type RateLimitResult = Readonly<{
  allowed: boolean;
  retryAfter?: number;
}>;

const MAX_REQUESTS_PER_MINUTE_GLOBAL = 50;
const MAX_REQUESTS_PER_MINUTE_PER_USER = 10;
const WINDOW_MS = 60_000;

const GLOBAL_KEY = "__global__";

export class RateLimitError extends Error {
  public readonly retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}

export class RateLimiter {
  private static instance: RateLimiter | null = null;

  // In-memory request history.
  public requestLogs: Map<string, RequestLog[]> = new Map();

  private cleanupIntervalId: NodeJS.Timeout | null = null;

  private constructor() {
    // Cleanup every full window to reduce memory growth.
    this.cleanupIntervalId = setInterval(() => {
      this.cleanup();
    }, WINDOW_MS);
    // Avoid keeping the process alive solely for this interval.
    if (typeof (this.cleanupIntervalId as unknown as { unref?: () => void }).unref === "function") {
      (this.cleanupIntervalId as unknown as { unref: () => void }).unref();
    }
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  checkLimit(userId?: string): RateLimitResult {
    const now = Date.now();
    this.pruneOld(GLOBAL_KEY, now);

    const globalLogs = this.requestLogs.get(GLOBAL_KEY) ?? [];
    const globalExceeded = globalLogs.length >= MAX_REQUESTS_PER_MINUTE_GLOBAL;
    const globalRetryAfterMs = globalExceeded ? this.computeRetryAfterMs(globalLogs, now, MAX_REQUESTS_PER_MINUTE_GLOBAL) : undefined;

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return globalExceeded
        ? { allowed: false, retryAfter: globalRetryAfterMs }
        : { allowed: true };
    }

    const userKey = userId.trim();
    this.pruneOld(userKey, now);

    const userLogs = this.requestLogs.get(userKey) ?? [];
    const userExceeded = userLogs.length >= MAX_REQUESTS_PER_MINUTE_PER_USER;
    const userRetryAfterMs = userExceeded ? this.computeRetryAfterMs(userLogs, now, MAX_REQUESTS_PER_MINUTE_PER_USER) : undefined;

    const allowed = !globalExceeded && !userExceeded;
    if (allowed) return { allowed: true };

    return {
      allowed: false,
      retryAfter: [globalRetryAfterMs, userRetryAfterMs].filter((n): n is number => typeof n === "number").reduce((a, b) => Math.max(a, b), 0) || undefined,
    };
  }

  /**
   * In-memory snapshot of current limits + consumption.
   * Used by health checks / diagnostics.
   */
  getStatus(userId?: string): Readonly<{
    windowMs: number;
    maxRequestsPerMinuteGlobal: number;
    maxRequestsPerMinutePerUser: number;
    globalCount: number;
    userCount: number;
    availableCapacity: number;
  }> {
    const now = Date.now();
    this.pruneOld(GLOBAL_KEY, now);

    const globalLogs = this.requestLogs.get(GLOBAL_KEY) ?? [];
    const globalCount = globalLogs.length;
    const globalRemaining = Math.max(0, MAX_REQUESTS_PER_MINUTE_GLOBAL - globalCount);

    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return {
        windowMs: WINDOW_MS,
        maxRequestsPerMinuteGlobal: MAX_REQUESTS_PER_MINUTE_GLOBAL,
        maxRequestsPerMinutePerUser: MAX_REQUESTS_PER_MINUTE_PER_USER,
        globalCount,
        userCount: 0,
        availableCapacity: globalRemaining,
      };
    }

    const userKey = userId.trim();
    this.pruneOld(userKey, now);
    const userLogs = this.requestLogs.get(userKey) ?? [];
    const userCount = userLogs.length;

    const userRemaining = Math.max(0, MAX_REQUESTS_PER_MINUTE_PER_USER - userCount);
    const availableCapacity = Math.min(globalRemaining, userRemaining);

    return {
      windowMs: WINDOW_MS,
      maxRequestsPerMinuteGlobal: MAX_REQUESTS_PER_MINUTE_GLOBAL,
      maxRequestsPerMinutePerUser: MAX_REQUESTS_PER_MINUTE_PER_USER,
      globalCount,
      userCount,
      availableCapacity,
    };
  }

  recordRequest(userId?: string): void {
    const now = Date.now();
    this.pruneOld(GLOBAL_KEY, now);
    this.appendLog(GLOBAL_KEY, { timestamp: now });

    if (!userId || typeof userId !== "string" || !userId.trim()) return;

    const userKey = userId.trim();
    this.pruneOld(userKey, now);
    this.appendLog(userKey, { timestamp: now, userId: userKey });
  }

  /**
   * Reset in-memory state.
   * Intended for unit tests.
   */
  reset(): void {
    this.requestLogs.clear();
  }

  private appendLog(key: string, log: RequestLog): void {
    const prev = this.requestLogs.get(key) ?? [];
    prev.push(log);
    this.requestLogs.set(key, prev);
  }

  private pruneOld(key: string, now: number): void {
    const logs = this.requestLogs.get(key);
    if (!logs || logs.length === 0) return;
    const cutoff = now - WINDOW_MS;
    const filtered = logs.filter((l) => l.timestamp >= cutoff);
    if (filtered.length === 0) this.requestLogs.delete(key);
    else this.requestLogs.set(key, filtered);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const key of this.requestLogs.keys()) {
      this.pruneOld(key, now);
    }
  }

  private computeRetryAfterMs(logs: RequestLog[], now: number, maxRequests: number): number | undefined {
    // We only allow when current window count is strictly < maxRequests.
    if (logs.length < maxRequests) return undefined;

    // logs are in insertion order; treat as ascending timestamps.
    const sorted = [...logs].sort((a, b) => a.timestamp - b.timestamp);

    const targetCount = maxRequests - 1;
    const toExpire = sorted.length - targetCount; // >= 1
    const expireIndex = toExpire - 1; // 0-based, among oldest
    const retryAt = sorted[expireIndex]?.timestamp ? sorted[expireIndex].timestamp + WINDOW_MS : undefined;
    if (!retryAt) return undefined;

    return Math.max(0, retryAt - now);
  }
}

export const rateLimiter = RateLimiter.getInstance();

