import { describe, it, expect, vi } from 'vitest';

// Mock the Supabase server import to prevent Next.js headers crash
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const { jsonError } = await import('./api-utils');

describe('jsonError', () => {
  it('returns default 400 status', async () => {
    const r = jsonError('Bad request');
    expect(r.status).toBe(400);
  });

  it('includes error message in body', async () => {
    const r = jsonError('Invalid input');
    const body = await r.json();
    expect(body).toEqual({ error: 'Invalid input' });
  });

  it('accepts custom status code', async () => {
    const r = jsonError('Not found', 404);
    expect(r.status).toBe(404);
  });

  it('returns 403 for forbidden', async () => {
    const r = jsonError('Forbidden', 403);
    expect(r.status).toBe(403);
    const body = await r.json();
    expect(body.error).toBe('Forbidden');
  });
});
