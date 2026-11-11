// Simple fixed-window rate limiter kept in process memory.
//
// NOTE: on serverless hosting (e.g. Vercel) each instance has its own memory, so this
// limit applies per instance, not globally, and resets on cold starts. A production
// version should keep counts in a shared store such as Redis (e.g. Upstash).

type RateLimitOptions = {
  /** Max requests allowed per key within one window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the current window resets (0 when allowed). */
  retryAfterSeconds: number;
};

type Entry = { count: number; resetAt: number };

export function createRateLimiter({ limit, windowMs }: RateLimitOptions) {
  const entries = new Map<string, Entry>();

  // Drop expired windows so the map can't grow without bound.
  function sweep(now: number) {
    for (const [key, entry] of entries) {
      if (entry.resetAt <= now) entries.delete(key);
    }
  }

  return function check(key: string, now: number = Date.now()): RateLimitResult {
    sweep(now);

    const entry = entries.get(key);
    if (!entry) {
      entries.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (entry.count >= limit) {
      return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
    }

    entry.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

/**
 * Best-effort client IP. Next.js no longer exposes `request.ip`, so read proxy headers.
 * These headers can be spoofed unless a trusted proxy (like Vercel's) sets them.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  // x-forwarded-for is "client, proxy1, proxy2"; the first entry is the client.
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
