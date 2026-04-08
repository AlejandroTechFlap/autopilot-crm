/**
 * PATCH  /api/admin/campos/[id] — partial update (clave + entidad immutable).
 * DELETE /api/admin/campos/[id] — delete definition + strip JSONB key from
 *                                 every row of the matching entity table in
 *                                 the same transaction (decision D3).
 *
 * Phase 10. Admin-only. The transactional strip is implemented in
 * `public.delete_campo_personalizado` (migration 011) and called via rpc().
 */

import { logger } from '@/lib/logger';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';
import { createClient } from '@/lib/supabase/server';
import { mapCampoRow } from '@/features/tenant/lib/custom-fields';
import { UpdateCampoSchema } from '@/features/admin/campos/schemas';
import type { Json } from '@/types/database';

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Ctx): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) {
    logger.warn({ scope: 'api.admin.campos', event: 'forbidden' });
    return auth;
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateCampoSchema.safeParse(body);
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

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) updates[key] = value;
  }
  if ('opciones' in updates) {
    updates.opciones = (updates.opciones as string[] | null) as Json;
  }
  if (Object.keys(updates).length === 0) {
    return jsonError('No fields to update', 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('campos_personalizados')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    const notFound = error?.code === 'PGRST116';
    logger.warn({
      scope: 'api.admin.campos',
      event: notFound ? 'not_found' : 'failed',
      userId: auth.id,
      campoId: id,
    });
    return jsonError(
      notFound
        ? 'Campo personalizado no encontrado'
        : 'Failed to update custom field: ' + (error?.message ?? 'unknown'),
      notFound ? 404 : 500
    );
  }

  logger.info({
    scope: 'api.admin.campos',
    event: 'updated',
    userId: auth.id,
    entidad: data.entidad,
    clave: data.clave,
    fields: Object.keys(updates),
  });
  return Response.json({ campo: mapCampoRow(data) });
}

export async function DELETE(_request: Request, { params }: Ctx): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) {
    logger.warn({ scope: 'api.admin.campos', event: 'forbidden' });
    return auth;
  }

  const { id } = await params;
  const supabase = await createClient();

  // Pre-fetch the definition so we can log {entidad, clave} even when the
  // stored procedure returns only the row-count. RLS blocks non-admins so
  // this is safe.
  const { data: existing, error: fetchError } = await supabase
    .from('campos_personalizados')
    .select('entidad, clave')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    logger.error({
      scope: 'api.admin.campos',
      event: 'failed',
      userId: auth.id,
      campoId: id,
      err: fetchError,
    });
    return jsonError(
      'Failed to lookup custom field: ' + fetchError.message,
      500
    );
  }
  if (!existing) {
    logger.warn({
      scope: 'api.admin.campos',
      event: 'not_found',
      userId: auth.id,
      campoId: id,
    });
    return jsonError('Campo personalizado no encontrado', 404);
  }

  // Transactional strip + delete — see migration 011.
  const { data: affectedRows, error: rpcError } = await supabase.rpc(
    'delete_campo_personalizado',
    { p_id: id }
  );

  if (rpcError) {
    logger.error({
      scope: 'api.admin.campos',
      event: 'failed',
      userId: auth.id,
      entidad: existing.entidad,
      clave: existing.clave,
      err: rpcError,
    });
    return jsonError(
      'Failed to delete custom field: ' + rpcError.message,
      500
    );
  }

  logger.info({
    scope: 'api.admin.campos',
    event: 'deleted',
    userId: auth.id,
    entidad: existing.entidad,
    clave: existing.clave,
    rowsStripped: affectedRows ?? 0,
  });
  return Response.json({ ok: true, rowsStripped: affectedRows ?? 0 });
}
