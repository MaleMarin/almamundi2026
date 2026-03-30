import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { memorySlidingWindowHit } from "@/lib/rate-limit-memory-fallback";

let _redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) {
    _redis = new Redis({ url, token });
    return _redis;
  }
  _redis = null;
  return null;
}

const limiterCache = new Map<string, Ratelimit>();

/**
 * Rate limit distribuido (Upstash Redis). En producción debe configurarse
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
 */
export function getRateLimiter(name: string, max: number, windowSeconds: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${name}:${max}:${windowSeconds}`;
  let rl = limiterCache.get(key);
  if (!rl) {
    rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
      prefix: `almamundi:rl:${name}`,
      analytics: false,
    });
    limiterCache.set(key, rl);
  }
  return rl;
}

export async function enforceRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
  memoryFallback?: { max: number; windowMs: number }
): Promise<NextResponse | null> {
  if (!limiter) {
    if (memoryFallback) {
      const { success, remaining } = memorySlidingWindowHit(
        identifier,
        memoryFallback.max,
        memoryFallback.windowMs
      );
      if (success) return null;
      const retryAfter = Math.ceil(memoryFallback.windowMs / 1000);
      return NextResponse.json(
        {
          error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.",
          retryAfter,
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter), "X-RateLimit-Remaining": String(remaining) },
        }
      );
    }
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[rate-limit] Configura UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN para límites fiables."
      );
    }
    return null;
  }
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  if (success) return null;
  return NextResponse.json(
    {
      error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.",
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
      },
    }
  );
}

export function clientIpFromRequest(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}
