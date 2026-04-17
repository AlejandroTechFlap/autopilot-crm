import { describe, it, expect, vi } from 'vitest';
import {
  generateWithRetry,
  isRetryableError,
  mapGeminiErrorToUserMessage,
} from './retry';

describe('isRetryableError', () => {
  it('returns true for retryable HTTP statuses', () => {
    for (const status of [429, 500, 502, 503, 504]) {
      expect(isRetryableError({ status })).toBe(true);
    }
  });

  it('returns true when the numeric code is retryable (Gemini style)', () => {
    expect(isRetryableError({ code: 503 })).toBe(true);
  });

  it('returns true when the message embeds a retryable marker', () => {
    expect(
      isRetryableError({
        message: '{"error":{"code":503,"status":"UNAVAILABLE"}}',
      }),
    ).toBe(true);
    expect(isRetryableError({ message: 'fetch failed' })).toBe(true);
    expect(isRetryableError({ message: 'ECONNRESET on socket' })).toBe(true);
  });

  it('returns false for non-retryable errors', () => {
    expect(isRetryableError({ status: 400 })).toBe(false);
    expect(isRetryableError({ status: 401 })).toBe(false);
    expect(isRetryableError({ message: 'INVALID_ARGUMENT: bad input' })).toBe(false);
    expect(isRetryableError(null)).toBe(false);
    expect(isRetryableError(undefined)).toBe(false);
    expect(isRetryableError({})).toBe(false);
  });
});

describe('generateWithRetry', () => {
  const nopSleep = () => Promise.resolve();

  it('returns the value on the first successful attempt without sleeping', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const sleep = vi.fn(nopSleep);

    const result = await generateWithRetry(fn, { sleep });

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retries transient errors and eventually succeeds', async () => {
    const transient = { status: 503, message: 'UNAVAILABLE' };
    const fn = vi
      .fn()
      .mockRejectedValueOnce(transient)
      .mockRejectedValueOnce(transient)
      .mockResolvedValue('recovered');
    const sleep = vi.fn(nopSleep);
    const onRetry = vi.fn();

    const result = await generateWithRetry(fn, { sleep, onRetry });

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, transient);
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, transient);
  });

  it('applies exponential backoff (600, 1200, 2400)', async () => {
    const transient = { status: 503 };
    const fn = vi
      .fn()
      .mockRejectedValueOnce(transient)
      .mockRejectedValueOnce(transient)
      .mockResolvedValue('done');
    const sleep = vi.fn(nopSleep);

    await generateWithRetry(fn, { sleep });

    expect(sleep).toHaveBeenNthCalledWith(1, 600);
    expect(sleep).toHaveBeenNthCalledWith(2, 1200);
  });

  it('stops retrying on non-retryable errors', async () => {
    const nonRetryable = { status: 400, message: 'INVALID_ARGUMENT' };
    const fn = vi.fn().mockRejectedValue(nonRetryable);
    const sleep = vi.fn(nopSleep);

    await expect(generateWithRetry(fn, { sleep })).rejects.toBe(nonRetryable);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('rethrows the last error after exhausting attempts', async () => {
    const transient = { status: 503 };
    const fn = vi.fn().mockRejectedValue(transient);
    const sleep = vi.fn(nopSleep);

    await expect(
      generateWithRetry(fn, { sleep, maxAttempts: 3 }),
    ).rejects.toBe(transient);
    expect(fn).toHaveBeenCalledTimes(3);
    // Sleep happens after attempts 1 and 2 — none after the final failed attempt.
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('respects a custom maxAttempts value', async () => {
    const transient = { status: 503 };
    const fn = vi.fn().mockRejectedValue(transient);
    const sleep = vi.fn(nopSleep);

    await expect(
      generateWithRetry(fn, { sleep, maxAttempts: 5 }),
    ).rejects.toBe(transient);
    expect(fn).toHaveBeenCalledTimes(5);
  });
});

describe('mapGeminiErrorToUserMessage', () => {
  it('maps 503 / UNAVAILABLE to a "saturated" message', () => {
    expect(mapGeminiErrorToUserMessage({ status: 503 })).toMatch(/saturado/i);
    expect(
      mapGeminiErrorToUserMessage({
        message: '{"error":{"code":503,"status":"UNAVAILABLE"}}',
      }),
    ).toMatch(/saturado/i);
  });

  it('maps 429 / RESOURCE_EXHAUSTED to a rate-limit message', () => {
    expect(mapGeminiErrorToUserMessage({ status: 429 })).toMatch(/límite/i);
    expect(
      mapGeminiErrorToUserMessage({ message: 'RESOURCE_EXHAUSTED quota' }),
    ).toMatch(/límite/i);
  });

  it('maps 504 / DEADLINE_EXCEEDED to a timeout message', () => {
    expect(mapGeminiErrorToUserMessage({ status: 504 })).toMatch(/tardado/i);
    expect(
      mapGeminiErrorToUserMessage({ message: 'DEADLINE_EXCEEDED' }),
    ).toMatch(/tardado/i);
  });

  it('maps 500 / 502 / INTERNAL to a transient-failure message', () => {
    expect(mapGeminiErrorToUserMessage({ status: 500 })).toMatch(/fallado/i);
    expect(mapGeminiErrorToUserMessage({ status: 502 })).toMatch(/fallado/i);
    expect(mapGeminiErrorToUserMessage({ message: 'INTERNAL error' })).toMatch(
      /fallado/i,
    );
  });

  it('maps 401 / 403 to an auth-rejected message', () => {
    expect(mapGeminiErrorToUserMessage({ status: 401 })).toMatch(/rechazado/i);
    expect(mapGeminiErrorToUserMessage({ status: 403 })).toMatch(/rechazado/i);
  });

  it('maps 400 / INVALID_ARGUMENT to a reformulate message', () => {
    expect(mapGeminiErrorToUserMessage({ status: 400 })).toMatch(/reformular/i);
    expect(
      mapGeminiErrorToUserMessage({ message: 'INVALID_ARGUMENT: bad input' }),
    ).toMatch(/reformular/i);
  });

  it('maps network errors to a connectivity message', () => {
    expect(mapGeminiErrorToUserMessage({ message: 'fetch failed' })).toMatch(
      /conectar/i,
    );
    expect(mapGeminiErrorToUserMessage({ message: 'ECONNRESET' })).toMatch(
      /conectar/i,
    );
  });

  it('falls back to a generic Spanish message for unknown errors', () => {
    expect(mapGeminiErrorToUserMessage({ message: 'totally unknown' })).toMatch(
      /error/i,
    );
    expect(mapGeminiErrorToUserMessage(null)).toMatch(/error/i);
    expect(mapGeminiErrorToUserMessage(undefined)).toMatch(/error/i);
  });

  it('never leaks raw JSON payloads', () => {
    const raw = '{"error":{"code":503,"message":"This model is currently experiencing high demand","status":"UNAVAILABLE"}}';
    const mapped = mapGeminiErrorToUserMessage({ message: raw });
    expect(mapped).not.toContain('{');
    expect(mapped).not.toContain('UNAVAILABLE');
    expect(mapped).not.toContain('high demand');
  });
});
