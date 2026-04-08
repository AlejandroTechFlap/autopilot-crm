/**
 * GET /api/admin/campos   — list every custom-field definition (all entities).
 * POST /api/admin/campos  — create a new definition.
 *
 * Phase 10. Admin-only. RLS in migration 010 is the second line of defence.
 */

import { logger } from '@/lib/logger';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';
import { createClient } from '@/lib/supabase/server';
import { mapCampoRow } from '@/features/tenant/lib/custom-fields';
import { CreateCampoSchema } from '@/features/admin/campos/schemas';
import type { Json } from '@/types/database';

export async function GET(): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) {
    logger.warn({ scope: 'api.admin.campos', event: 'forbidden' });
    return auth;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('campos_personalizados')
    .select('*')
    .order('entidad', { ascending: true })
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    logger.error({
      scope: 'api.admin.campos',
      event: 'failed',
      userId: auth.id,
      err: error,
    });
    return jsonError('Failed to load custom fields: ' + error.message, 500);
  }

  const campos = (data ?? []).map(mapCampoRow);
  logger.info({
    scope: 'api.admin.campos',
    event: 'requested',
    userId: auth.id,
    count: campos.length,
  });
  return Response.json({ campos });
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) {
    logger.warn({ scope: 'api.admin.campos', event: 'forbidden' });
    return auth;
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateCampoSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn({
      scope: 'api.admin.campos',
      event: 'invalid',
      issues: parsed.error.issues.length,
    });
    return jsonError(
      parsed.error.issues.map((i) => i.message).join(', '),
      400
    );
  }

  const supabase = await createClient();
  const { entidad, clave, etiqueta, tipo, opciones, orden, obligatorio } =
    parsed.data;

  const { data, error } = await supabase
    .from('campos_personalizados')
    .insert({
      entidad,
      clave,
      etiqueta,
      tipo,
      opciones: tipo === 'seleccion' ? ((opciones ?? []) as Json) : null,
      orden: orden ?? 0,
      obligatorio: obligatorio ?? false,
    })
    .select('*')
    .single();

  if (error || !data) {
    // Unique violation on (entidad, clave) → 409.
    const isDup = error?.code === '23505';
    logger.warn({
      scope: 'api.admin.campos',
      event: isDup ? 'invalid' : 'failed',
      userId: auth.id,
      entidad,
      clave,
    });
    return jsonError(
      isDup
        ? `Ya existe un campo "${clave}" para ${entidad}`
        : 'Failed to create custom field: ' + (error?.message ?? 'unknown'),
      isDup ? 409 : 500
    );
  }

  logger.info({
    scope: 'api.admin.campos',
    event: 'created',
    userId: auth.id,
    entidad,
    clave,
  });
  return Response.json({ campo: mapCampoRow(data) }, { status: 201 });
}
