/**
 * In-memory token-bucket rate limiter.
 *
 * Single-container deployment only — state is per-process and is lost on
 * restart. For a horizontally scaled deployment, swap the implementation for
 * Redis (or Supabase) but keep the same `rateLimit()` signature so callers do
 * not need to change.
 *
 * Limits currently in use (keep this list in sync with the call sites):
 *
 *   POST /api/chat          → 20 req / 60s per user
 *   GET  /api/chat/summary  →  5 req / 60s per user
 *   GET  /api/search        → 60 req / 60s per user
 *
 * Login is handled by Supabase Auth directly (client-side SDK, no Next.js
 * route), so auth rate limiting is enforced upstream by Supabase.
 */

interface Bucket {
  tokens: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export interface RateLimitOk {
  ok: true;
}

export interface RateLimitDenied {
  ok: false;
  retryAfterSeconds: number;
}

export type RateLimitResult = RateLimitOk | RateLimitDenied;

/**
 * Consume one token from the bucket identified by `key`. Returns `{ ok: true }`
 * when the request should proceed, or `{ ok: false, retryAfterSeconds }` when
 * the caller must back off.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    // Window expired (or never existed) — start a fresh bucket and charge
    // one token for this request.
    if (buckets.size >= MAX_KEYS) {
      evictExpired(now);
      if (buckets.size >= MAX_KEYS) {
        const oldest = buckets.keys().next().value;
        if (oldest !== undefined) buckets.delete(oldest);
      }
    }
    buckets.set(key, { tokens: limit - 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (existing.tokens <= 0) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.tokens -= 1;
  return { ok: true };
}

/** Evict any buckets whose window has already closed. */
function evictExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/**
 * Convenience: build a 429 response with `Retry-After` when a limit is hit.
 * Callers should early-return this from their route handler.
 */
export function rateLimitResponse(denied: RateLimitDenied): Response {
  return Response.json(
    { error: "Demasiadas solicitudes. Inténtalo de nuevo en unos segundos." },
    {
      status: 429,
      headers: { "Retry-After": String(denied.retryAfterSeconds) },
    },
  );
}

/**
 * Extract the client IP from an incoming request. Falls back to `"unknown"`
 * so callers never need a null-check.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
