/**
 * Phase 10 — feature flag guard for hard-404 enforcement (decision D4).
 *
 * Server-side helper. Page routes call `requireFeatureFlag('feat_x')` and
 * are bounced to `notFound()` if the flag is off. API routes call
 * `assertFeatureFlag('feat_x')` and get a thrown 404 instead of a 403, so
 * disabled features look like they don't exist at all.
 */

import 'server-only';
import { notFound } from 'next/navigation';
import { logger } from '@/lib/logger';
import { getTenantConfig } from './get-tenant-config';
import type { FeatureFlag } from '../types';

/**
 * Page-route guard. Awaits the cached tenant config, calls `notFound()`
 * (which throws) if the flag is off, otherwise returns the boolean.
 *
 * Usage in a server component:
 *   await requireFeatureFlag('feat_admin_kpis');
 */
export async function requireFeatureFlag(flag: FeatureFlag): Promise<true> {
  const config = await getTenantConfig();
  if (!config.flags[flag]) {
    logger.warn({
      scope: 'feat.tenant.flag',
      event: 'not_found',
      flag,
      surface: 'page',
    });
    notFound();
  }
  return true;
}

/**
 * API-route guard. Returns `null` if the flag is on; returns a 404 `Response`
 * if it is off so the caller can early-return.
 *
 * Usage:
 *   const blocked = await assertFeatureFlag('feat_ai_chat');
 *   if (blocked) return blocked;
 */
export async function assertFeatureFlag(
  flag: FeatureFlag
): Promise<Response | null> {
  const config = await getTenantConfig();
  if (!config.flags[flag]) {
    logger.warn({
      scope: 'feat.tenant.flag',
      event: 'not_found',
      flag,
      surface: 'api',
    });
    return new Response('Not Found', { status: 404 });
  }
  return null;
}
