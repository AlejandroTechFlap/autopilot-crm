import { createClient } from '@/lib/supabase/server';
import type { ApiUser } from '@/lib/api-utils';

/**
 * Notification engine triggers.
 *
 * On-demand checks (no cron). Called from /api/notificaciones/count.
 * For each trigger, checks the source data and inserts a row in
 * `notificaciones` if a matching one does not already exist (deduped
 * by referencia_id + tipo + day).
 */

const STALLED_DEAL_FACTOR = 1.5;

export async function runTriggers(user: ApiUser): Promise<void> {
  await Promise.all([
    checkOverdueFollowUps(user),
    checkStalledDeals(user),
  ]);
}

interface NotificationCandidate {
  usuario_id: string;
  titulo: string;
  contenido: string;
  tipo: string;
  referencia_id: string;
}

/**
 * Trigger 1: Overdue follow-up
 * empresa.proxima_accion_fecha < today AND vendedor_asignado = user.id
 */
async function checkOverdueFollowUps(user: ApiUser): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from('empresas')
    .select('id, nombre, proxima_accion, proxima_accion_fecha, vendedor_asignado')
    .lt('proxima_accion_fecha', today)
    .not('proxima_accion_fecha', 'is', null);

  if (user.rol === 'vendedor') {
    query = query.eq('vendedor_asignado', user.id);
  }

  const { data: empresas } = await query.limit(50);
  if (!empresas || empresas.length === 0) return;

  const candidates: NotificationCandidate[] = empresas
    .filter((e) => e.vendedor_asignado)
    .map((e) => ({
      usuario_id: e.vendedor_asignado as string,
      titulo: 'Overdue follow-up',
      contenido: `${e.nombre} has a pending action: ${e.proxima_accion ?? 'follow up'}`,
      tipo: 'follow_up_overdue',
      referencia_id: e.id,
    }));

  await insertIfMissing(candidates);
}

/**
 * Trigger 2: Stalled deal
 * deal.fecha_entrada_fase older than fase.tiempo_esperado * 1.5 days
 */
async function checkStalledDeals(user: ApiUser): Promise<void> {
  const supabase = await createClient();

  let query = supabase
    .from('deals')
    .select(`
      id, valor, fecha_entrada_fase, vendedor_asignado,
      empresa:empresas!deals_empresa_id_fkey(id, nombre),
      fase:fases!deals_fase_actual_fkey(id, nombre, tiempo_esperado)
    `)
    .is('resultado', null);

  if (user.rol === 'vendedor') {
    query = query.eq('vendedor_asignado', user.id);
  }

  const { data: deals } = await query.limit(100);
  if (!deals || deals.length === 0) return;

  const now = Date.now();
  const candidates: NotificationCandidate[] = [];

  for (const d of deals) {
    const fase = d.fase as { id: string; nombre: string; tiempo_esperado: number | null } | null;
    const empresa = d.empresa as { id: string; nombre: string } | null;
    if (!fase?.tiempo_esperado || !empresa || !d.vendedor_asignado) continue;

    const entered = new Date(d.fecha_entrada_fase).getTime();
    const daysInPhase = (now - entered) / (1000 * 60 * 60 * 24);
    if (daysInPhase <= fase.tiempo_esperado * STALLED_DEAL_FACTOR) continue;

    candidates.push({
      usuario_id: d.vendedor_asignado,
      titulo: 'Stalled deal',
      contenido: `${empresa.nombre} has been in "${fase.nombre}" for ${Math.round(daysInPhase)} days`,
      tipo: 'deal_stalled',
      referencia_id: d.id,
    });
  }

  await insertIfMissing(candidates);
}

/**
 * Inserts notifications only when no matching row exists today.
 * Dedupes by (usuario_id, tipo, referencia_id, created_at >= today 00:00).
 */
async function insertIfMissing(candidates: NotificationCandidate[]): Promise<void> {
  if (candidates.length === 0) return;
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const refIds = candidates.map((c) => c.referencia_id);

  const { data: existing } = await supabase
    .from('notificaciones')
    .select('usuario_id, tipo, referencia_id')
    .in('referencia_id', refIds)
    .gte('created_at', todayIso);

  const existingKeys = new Set(
    (existing ?? []).map((e) => `${e.usuario_id}|${e.tipo}|${e.referencia_id}`)
  );

  const toInsert = candidates.filter(
    (c) => !existingKeys.has(`${c.usuario_id}|${c.tipo}|${c.referencia_id}`)
  );

  if (toInsert.length === 0) return;
  await supabase.from('notificaciones').insert(toInsert);
}
