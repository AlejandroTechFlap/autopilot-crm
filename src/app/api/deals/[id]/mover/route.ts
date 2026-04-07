import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const SCOPE = 'api.deals.move';

const MoverSchema = z.object({
  fase_destino: z.string().uuid(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const startedAt = Date.now();
  const { id: dealId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = MoverSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('fase_destino (UUID) is required');
  }

  const { fase_destino } = parsed.data;
  const supabase = await createClient();

  // Get current deal
  const { data: deal } = await supabase
    .from('deals')
    .select('id, fase_actual, empresa_id, vendedor_asignado')
    .eq('id', dealId)
    .single();

  if (!deal) {
    logger.warn({ scope: SCOPE, event: 'deal_not_found', userId: user.id, dealId });
    return jsonError('Deal not found', 404);
  }

  // Vendedores can only move their own deals
  if (user.rol === 'vendedor' && deal.vendedor_asignado !== user.id) {
    logger.warn({ scope: SCOPE, event: 'forbidden', userId: user.id, dealId });
    return jsonError('Forbidden', 403);
  }

  if (deal.fase_actual === fase_destino) {
    return Response.json({ deal });
  }

  // Get phase names for activity log
  const { data: fases } = await supabase
    .from('fases')
    .select('id, nombre')
    .in('id', [deal.fase_actual, fase_destino]);

  const fromName = fases?.find((f) => f.id === deal.fase_actual)?.nombre ?? 'Unknown';
  const toName = fases?.find((f) => f.id === fase_destino)?.nombre ?? 'Unknown';

  // Update deal
  const { data: updated, error } = await supabase
    .from('deals')
    .update({
      fase_actual: fase_destino,
      fecha_entrada_fase: new Date().toISOString(),
    })
    .eq('id', dealId)
    .select()
    .single();

  if (error) {
    logger.error({
      scope: SCOPE,
      event: 'update_failed',
      userId: user.id,
      dealId,
      durationMs: Date.now() - startedAt,
      err: error,
    });
    return jsonError('Failed to move deal: ' + error.message);
  }

  // Log phase change activity
  await supabase.from('actividades').insert({
    empresa_id: deal.empresa_id,
    deal_id: dealId,
    tipo: 'cambio_fase',
    contenido: `Phase changed: ${fromName} → ${toName}`,
    usuario_id: user.id,
  });

  logger.info({
    scope: SCOPE,
    event: 'success',
    userId: user.id,
    dealId,
    fromPhase: deal.fase_actual,
    toPhase: fase_destino,
    durationMs: Date.now() - startedAt,
  });

  return Response.json({ deal: updated });
}
