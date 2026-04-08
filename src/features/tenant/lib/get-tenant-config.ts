/**
 * Phase 10 — server-only tenant config loader.
 *
 * Wrapped in React's `cache()` so the singleton row is fetched at most once
 * per server request, regardless of how many components ask for it. The
 * dashboard layout calls this once and pushes the result down via context;
 * route handlers and admin pages can also call it directly.
 */

import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { mapCampoRow, mapTenantRow } from './custom-fields';
import type { CampoPersonalizado, Entidad, TenantConfig } from '../types';

/**
 * Load the singleton `configuracion_tenant` row.
 * Throws if the row is missing — every install must have it (seeded by
 * migration 010).
 */
export const getTenantConfig = cache(async (): Promise<TenantConfig> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('configuracion_tenant')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error({ scope: 'feat.tenant.config', event: 'failed', err: error });
    throw new Error('Failed to load tenant config');
  }
  if (!data) {
    logger.error({ scope: 'feat.tenant.config', event: 'not_found' });
    throw new Error('Tenant config row missing — migration 010 not applied?');
  }
  return mapTenantRow(data);
});

/**
 * Load custom field definitions for one entity, ordered by `orden`.
 * Returns `[]` if none defined.
 */
export const getCamposPersonalizados = cache(
  async (entidad: Entidad): Promise<CampoPersonalizado[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('campos_personalizados')
      .select('*')
      .eq('entidad', entidad)
      .order('orden', { ascending: true });

    if (error) {
      logger.error({
        scope: 'feat.tenant.campos',
        event: 'failed',
        entidad,
        err: error,
      });
      throw new Error('Failed to load custom field definitions');
    }
    return (data ?? []).map(mapCampoRow);
  }
);

/** Load all custom field definitions across all three entities (admin screen). */
export const getAllCamposPersonalizados = cache(
  async (): Promise<CampoPersonalizado[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('campos_personalizados')
      .select('*')
      .order('entidad', { ascending: true })
      .order('orden', { ascending: true });

    if (error) {
      logger.error({
        scope: 'feat.tenant.campos',
        event: 'failed',
        err: error,
      });
      throw new Error('Failed to load custom field definitions');
    }
    return (data ?? []).map(mapCampoRow);
  }
);
