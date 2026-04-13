import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { rateLimit, rateLimitResponse, clientIp } from './rate-limit';
import type { RateLimitDenied } from './rate-limit';

let keyIdx = 0;
/** Unique key per test to avoid module-level Map collisions. */
function uniqueKey() {
  return `test-${++keyIdx}-${Date.now()}`;
}

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 12, 12, 0, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('allows the first call', () => {
    expect(rateLimit(uniqueKey(), 5, 60_000)).toEqual({ ok: true });
  });

  it('allows calls up to the limit', () => {
    const key = uniqueKey();
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000).ok).toBe(true);
    }
  });

  it('denies call exceeding the limit', () => {
    const key = uniqueKey();
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
    const r = rateLimit(key, 5, 60_000);
    expect(r.ok).toBe(false);
    expect((r as RateLimitDenied).retryAfterSeconds).toBeGreaterThan(0);
  });

  it('returns retryAfterSeconds ≤ window/1000', () => {
    const key = uniqueKey();
    rateLimit(key, 1, 10_000); // consume single token
    const r = rateLimit(key, 1, 10_000) as RateLimitDenied;
    expect(r.ok).toBe(false);
    expect(r.retryAfterSeconds).toBeLessThanOrEqual(10);
  });

  it('resets after window expires', () => {
    const key = uniqueKey();
    rateLimit(key, 1, 5_000); // consume single token
    expect(rateLimit(key, 1, 5_000).ok).toBe(false); // denied

    vi.advanceTimersByTime(5_001);
    expect(rateLimit(key, 1, 5_000).ok).toBe(true); // fresh window
  });

  it('isolates different keys', () => {
    const k1 = uniqueKey();
    const k2 = uniqueKey();
    rateLimit(k1, 1, 60_000); // exhaust k1
    expect(rateLimit(k1, 1, 60_000).ok).toBe(false);
    expect(rateLimit(k2, 1, 60_000).ok).toBe(true); // k2 unaffected
  });
});

describe('rateLimitResponse', () => {
  it('returns 429 status', async () => {
    const r = rateLimitResponse({ ok: false, retryAfterSeconds: 30 });
    expect(r.status).toBe(429);
  });

  it('sets Retry-After header', () => {
    const r = rateLimitResponse({ ok: false, retryAfterSeconds: 15 });
    expect(r.headers.get('Retry-After')).toBe('15');
  });

  it('includes Spanish error message', async () => {
    const r = rateLimitResponse({ ok: false, retryAfterSeconds: 5 });
    const body = await r.json();
    expect(body.error).toContain('Demasiadas solicitudes');
  });
});

describe('clientIp', () => {
  it('extracts first IP from x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(clientIp(req)).toBe('1.2.3.4');
  });

  it('extracts single IP from x-forwarded-for', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.1' },
    });
    expect(clientIp(req)).toBe('10.0.0.1');
  });

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '192.168.1.1' },
    });
    expect(clientIp(req)).toBe('192.168.1.1');
  });

  it('returns "unknown" when no headers present', () => {
    const req = new Request('http://localhost');
    expect(clientIp(req)).toBe('unknown');
  });
});
