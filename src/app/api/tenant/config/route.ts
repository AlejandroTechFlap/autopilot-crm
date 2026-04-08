/**
 * GET /api/tenant/config
 *
 * Phase 10 — read-only access to the singleton `configuracion_tenant` row.
 * Available to every authenticated user (sidebar / layout / forms read this).
 * Admin-only mutation lives at `PATCH /api/admin/tenant`.
 */

import { logger } from '@/lib/logger';
import { requireApiAuth } from '@/lib/api-utils';
import { getTenantConfig } from '@/features/tenant/lib/get-tenant-config';

export async function GET(): Promise<Response> {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;

  try {
    const tenant = await getTenantConfig();
    return Response.json({ tenant });
  } catch (err) {
    logger.error({ scope: 'api.tenant.config', event: 'failed', err });
    return Response.json({ error: 'Failed to load tenant config' }, { status: 500 });
  }
}
