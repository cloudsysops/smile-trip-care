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
  check(key: string, options: RateLimitOptions): Promise<RateLimitResult>;
}

type MemoryEntry = {
  count: number;
  resetAt: number;
};

class InMemoryRateLimitProvider implements RateLimitProvider {
  private readonly store = new Map<string, MemoryEntry>();

  async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
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

class UpstashRateLimitProvider implements RateLimitProvider {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly prefix: string,
    private readonly fallback: RateLimitProvider,
  ) {}

  private async command(parts: string[]): Promise<unknown> {
    const path = parts.map((p) => encodeURIComponent(p)).join("/");
    const response = await fetch(`${this.url.replace(/\/$/, "")}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      cache: "no-store",
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || !("result" in (json as Record<string, unknown>))) {
      throw new Error(`Upstash command failed (${response.status})`);
    }
    return (json as { result: unknown }).result;
  }

  private async commandNumber(parts: string[]): Promise<number> {
    const result = await this.command(parts);
    const numeric = Number(result);
    if (!Number.isFinite(numeric)) {
      throw new Error("Upstash command returned non-numeric result");
    }
    return numeric;
  }

  async check(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    const now = Date.now();
    const redisKey = `${this.prefix}:${key}`;

    try {
      const count = await this.commandNumber(["incr", redisKey]);
      if (count === 1) {
        await this.commandNumber(["pexpire", redisKey, String(options.windowMs)]);
      }

      let ttlMs = await this.commandNumber(["pttl", redisKey]);
      if (ttlMs < 0) ttlMs = options.windowMs;

      return {
        allowed: count <= options.maxRequests,
        limit: options.maxRequests,
        remaining: Math.max(0, options.maxRequests - count),
        resetAt: now + ttlMs,
      };
    } catch (err) {
      console.warn("[rate-limit] Upstash provider failed; falling back to memory", String(err));
      return this.fallback.check(key, options);
    }
  }
}

let provider: RateLimitProvider | null = null;

/**
 * Abstraction layer for rate limiting providers.
 * Default is in-memory for local/dev; production can switch to Upstash.
 */
export function getRateLimitProvider(): RateLimitProvider {
  if (provider) return provider;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const selected = process.env.RATE_LIMIT_PROVIDER ?? (upstashUrl && upstashToken ? "upstash" : "memory");

  switch (selected) {
    case "upstash": {
      const prefix = process.env.RATE_LIMIT_UPSTASH_PREFIX ?? "smile:ratelimit";
      if (upstashUrl && upstashToken) {
        provider = new UpstashRateLimitProvider(
          upstashUrl,
          upstashToken,
          prefix,
          new InMemoryRateLimitProvider(),
        );
        return provider;
      }
      console.warn("[rate-limit] RATE_LIMIT_PROVIDER=upstash but Upstash env is missing; falling back to memory");
      provider = new InMemoryRateLimitProvider();
      return provider;
    }
    case "memory":
    default:
      provider = new InMemoryRateLimitProvider();
      return provider;
  }
}

export function setRateLimitProviderForTests(next: RateLimitProvider | null) {
  provider = next;
}
