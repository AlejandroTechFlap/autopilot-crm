/**
 * KPI tools.
 *
 * `getKpisVendedor` mirrors `/api/mis-kpis/route.ts` — pipeline value, pending
 * + overdue tasks, today's activities, won this month, commission. Defaults
 * to the current user when `vendedor_id` is omitted.
 *
 * `getKpisDireccion` mirrors `/api/dashboard/kpis/route.ts` — team-wide
 * pipeline + per-vendedor breakdown + previous-period deltas. The dispatcher
 * (tools/index.ts) gates this on role BEFORE invoking it, so vendedor callers
 * never reach this function.
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { ApiUser } from '@/lib/api-utils';
import { currentPeriodCode, monthStartIso, todayStartIso } from './helpers';

type Supabase = SupabaseClient<Database>;

export const GetKpisVendedorSchema = z.object({
  vendedor_id: z.string().uuid().optional(),
});
export type GetKpisVendedorInput = z.infer<typeof GetKpisVendedorSchema>;

export const GetKpisDireccionSchema = z.object({
  periodo: z.enum(['7d', 'month', 'quarter']).optional(),
});
export type GetKpisDireccionInput = z.infer<typeof GetKpisDireccionSchema>;

export async function getKpisVendedor(
  input: GetKpisVendedorInput,
  supabase: Supabase,
  user: ApiUser
) {
  const vendedorId = input.vendedor_id ?? user.id;

  const [open, pending, overdue, todayAct, won, commissions, vendedor] =
    await Promise.all([
      supabase
        .from('deals')
        .select('valor')
        .eq('vendedor_asignado', vendedorId)
        .is('resultado', null),
      supabase
        .from('tareas')
        .select('id', { count: 'exact', head: true })
        .eq('vendedor_asignado', vendedorId)
        .eq('completada', false),
      supabase
        .from('tareas')
        .select('id', { count: 'exact', head: true })
        .eq('vendedor_asignado', vendedorId)
        .eq('completada', false)
        .lt('fecha_vencimiento', todayStartIso()),
      supabase
        .from('actividades')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', vendedorId)
        .gte('created_at', todayStartIso()),
      supabase
        .from('deals')
        .select('valor')
        .eq('vendedor_asignado', vendedorId)
        .eq('resultado', 'ganado')
        .gte('cerrado_en', monthStartIso()),
      supabase
        .from('comisiones')
        .select('importe_comision')
        .eq('vendedor_id', vendedorId)
        .eq('periodo', currentPeriodCode()),
      supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('id', vendedorId)
        .maybeSingle(),
    ]);

  const openDeals = open.data ?? [];
  const wonDeals = won.data ?? [];

  return {
    vendedor: vendedor.data,
    kpis: {
      deals_abiertos: openDeals.length,
      valor_pipeline: openDeals.reduce((s, d) => s + (d.valor ?? 0), 0),
      tareas_pendientes: pending.count ?? 0,
      tareas_vencidas: overdue.count ?? 0,
      actividades_hoy: todayAct.count ?? 0,
      deals_ganados_mes: wonDeals.length,
      valor_ganado_mes: wonDeals.reduce((s, d) => s + (d.valor ?? 0), 0),
      comision_mes: (commissions.data ?? []).reduce(
        (s, c) => s + (c.importe_comision ?? 0),
        0
      ),
    },
  };
}

function getPeriodStart(periodo: string): string {
  const now = new Date();
  switch (periodo) {
    case '7d':
      return new Date(now.getTime() - 7 * 86_400_000).toISOString();
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), q, 1).toISOString();
    }
    case 'month':
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
}

export async function getKpisDireccion(
  input: GetKpisDireccionInput,
  supabase: Supabase
) {
  const periodo = input.periodo ?? 'month';
  const periodStart = getPeriodStart(periodo);

  const [openRes, wonRes, lostRes, actRes, overdueRes, vendsRes] =
    await Promise.all([
      supabase.from('deals').select('valor').is('resultado', null),
      supabase
        .from('deals')
        .select('valor')
        .eq('resultado', 'ganado')
        .gte('cerrado_en', periodStart),
      supabase
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('resultado', 'perdido')
        .gte('cerrado_en', periodStart),
      supabase
        .from('actividades')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', periodStart),
      supabase
        .from('tareas')
        .select('id', { count: 'exact', head: true })
        .eq('completada', false)
        .lt('fecha_vencimiento', todayStartIso()),
      supabase.from('usuarios').select('id, nombre').eq('rol', 'vendedor'),
    ]);

  const openDeals = openRes.data ?? [];
  const wonDeals = wonRes.data ?? [];
  const dealsGanados = wonDeals.length;
  const dealsPerdidos = lostRes.count ?? 0;
  const valorGanado = wonDeals.reduce((s, d) => s + (d.valor ?? 0), 0);
  const total = dealsGanados + dealsPerdidos;
  const tasaConversion = total > 0 ? (dealsGanados / total) * 100 : 0;
  const ticketMedio = dealsGanados > 0 ? valorGanado / dealsGanados : 0;

  const vendedores = vendsRes.data ?? [];
  const porVendedor = await Promise.all(
    vendedores.map(async (v) => {
      const [vOpen, vWon, vAct] = await Promise.all([
        supabase
          .from('deals')
          .select('valor')
          .eq('vendedor_asignado', v.id)
          .is('resultado', null),
        supabase
          .from('deals')
          .select('id', { count: 'exact', head: true })
          .eq('vendedor_asignado', v.id)
          .eq('resultado', 'ganado')
          .gte('cerrado_en', periodStart),
        supabase
          .from('actividades')
          .select('id', { count: 'exact', head: true })
          .eq('usuario_id', v.id)
          .gte('created_at', periodStart),
      ]);
      const vOpenDeals = vOpen.data ?? [];
      return {
        vendedor: v,
        deals_abiertos: vOpenDeals.length,
        valor_pipeline: vOpenDeals.reduce((s, d) => s + (d.valor ?? 0), 0),
        deals_ganados: vWon.count ?? 0,
        actividades: vAct.count ?? 0,
      };
    })
  );

  return {
    periodo,
    kpis: {
      total_pipeline_value: openDeals.reduce((s, d) => s + (d.valor ?? 0), 0),
      deals_abiertos: openDeals.length,
      deals_ganados: dealsGanados,
      deals_perdidos: dealsPerdidos,
      tasa_conversion: Math.round(tasaConversion * 10) / 10,
      valor_ganado: valorGanado,
      ticket_medio: Math.round(ticketMedio),
      actividades_periodo: actRes.count ?? 0,
      tareas_vencidas: overdueRes.count ?? 0,
    },
    por_vendedor: porVendedor,
  };
}
