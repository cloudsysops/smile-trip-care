export type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export interface RateLimitProvider {
  check(key: string, options: RateLimitOptions): RateLimitResult;
}

type RateLimitProviderFactory = () => RateLimitProvider;

type MemoryEntry = {
  count: number;
  resetAt: number;
};

class InMemoryRateLimitProvider implements RateLimitProvider {
  private readonly store = new Map<string, MemoryEntry>();

  check(key: string, options: RateLimitOptions): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || now > entry.resetAt) {
      const resetAt = now + options.windowMs;
      this.store.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        limit: options.maxRequests,
        remaining: Math.max(0, options.maxRequests - 1),
        resetAt,
      };
    }

    if (entry.count >= options.maxRequests) {
      return {
        allowed: false,
        limit: options.maxRequests,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    entry.count += 1;
    return {
      allowed: true,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }
}

let provider: RateLimitProvider | null = null;
const providerFactories = new Map<string, RateLimitProviderFactory>();

function createMemoryProvider() {
  return new InMemoryRateLimitProvider();
}

providerFactories.set("memory", createMemoryProvider);

/**
 * Abstraction layer for rate limiting providers.
 * Default is in-memory for local/dev.
 * A production provider (e.g. Upstash Redis) can be plugged via registerRateLimitProvider.
 */
export function getRateLimitProvider(): RateLimitProvider {
  if (provider) return provider;

  const selected = process.env.RATE_LIMIT_PROVIDER?.trim().toLowerCase() || "memory";
  const factory = providerFactories.get(selected);
  if (factory) {
    provider = factory();
    return provider;
  }

  provider = createMemoryProvider();
  return provider;
}

export function setRateLimitProviderForTests(next: RateLimitProvider | null) {
  provider = next;
}

export function registerRateLimitProvider(name: string, factory: RateLimitProviderFactory) {
  const key = name.trim().toLowerCase();
  if (!key) {
    throw new Error("Rate limit provider name is required");
  }
  providerFactories.set(key, factory);
  provider = null;
}
