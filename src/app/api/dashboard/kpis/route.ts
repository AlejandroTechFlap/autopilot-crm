import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import type { NextRequest } from 'next/server';

function getPeriodStart(periodo: string): string {
  const now = new Date();
  switch (periodo) {
    case '7d':
      return new Date(now.getTime() - 7 * 86_400_000).toISOString();
    case 'quarter': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), qMonth, 1).toISOString();
    }
    case 'month':
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
}

/**
 * Returns [start, end) for the previous comparison period.
 *
 * For `month` and `quarter` we align to "period-to-date": if today is the 7th
 * of April, the previous range is March 1 → March 7 (NOT all of March). This
 * keeps deltas meaningful early in the period instead of always showing -100%.
 *
 * For `7d` the previous range is the 7 days immediately before the current
 * window (already same-length, no alignment needed).
 */
function getPrevPeriodRange(periodo: string): { start: string; end: string } {
  const now = new Date();
  switch (periodo) {
    case '7d': {
      const end = new Date(now.getTime() - 7 * 86_400_000);
      const start = new Date(end.getTime() - 7 * 86_400_000);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    case 'quarter': {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const elapsedMs = now.getTime() - new Date(now.getFullYear(), qMonth, 1).getTime();
      const start = new Date(now.getFullYear(), qMonth - 3, 1);
      const end = new Date(start.getTime() + elapsedMs);
      return { start: start.toISOString(), end: end.toISOString() };
    }
    case 'month':
    default: {
      const elapsedMs =
        now.getTime() - new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(start.getTime() + elapsedMs);
      return { start: start.toISOString(), end: end.toISOString() };
    }
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  if (user.rol === 'vendedor') {
    return jsonError('Forbidden', 403);
  }

  const periodo = request.nextUrl.searchParams.get('periodo') ?? 'month';
  const periodStart = getPeriodStart(periodo);
  const prevRange = getPrevPeriodRange(periodo);
  const todayStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  ).toISOString();

  const supabase = await createClient();

  const [
    openDealsRes,
    wonDealsRes,
    lostDealsRes,
    activitiesRes,
    overdueTasksRes,
    vendedoresRes,
    prevWonDealsRes,
    prevLostDealsRes,
  ] = await Promise.all([
    // All open deals
    supabase.from('deals').select('valor').is('resultado', null),
    // Won deals in period
    supabase
      .from('deals')
      .select('valor')
      .eq('resultado', 'ganado')
      .gte('cerrado_en', periodStart),
    // Lost deals in period
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('resultado', 'perdido')
      .gte('cerrado_en', periodStart),
    // Activities in period
    supabase
      .from('actividades')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', periodStart),
    // Overdue tasks
    supabase
      .from('tareas')
      .select('id', { count: 'exact', head: true })
      .eq('completada', false)
      .lt('fecha_vencimiento', todayStart),
    // Per-vendedor breakdown
    supabase.from('usuarios').select('id, nombre').eq('rol', 'vendedor'),
    // Previous period: won deals
    supabase
      .from('deals')
      .select('valor')
      .eq('resultado', 'ganado')
      .gte('cerrado_en', prevRange.start)
      .lt('cerrado_en', prevRange.end),
    // Previous period: lost deals
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('resultado', 'perdido')
      .gte('cerrado_en', prevRange.start)
      .lt('cerrado_en', prevRange.end),
  ]);

  const openDeals = openDealsRes.data ?? [];
  const wonDeals = wonDealsRes.data ?? [];
  const dealsGanados = wonDeals.length;
  const dealsPerdidos = lostDealsRes.count ?? 0;
  const valorGanado = wonDeals.reduce((s, d) => s + (d.valor ?? 0), 0);

  const total = dealsGanados + dealsPerdidos;
  const tasaConversion = total > 0 ? (dealsGanados / total) * 100 : 0;
  const ticketMedio = dealsGanados > 0 ? valorGanado / dealsGanados : 0;

  // Previous-period stats for delta calculations
  const prevWonDeals = prevWonDealsRes.data ?? [];
  const prevDealsGanados = prevWonDeals.length;
  const prevDealsPerdidos = prevLostDealsRes.count ?? 0;
  const prevValorGanado = prevWonDeals.reduce((s, d) => s + (d.valor ?? 0), 0);
  const prevTotal = prevDealsGanados + prevDealsPerdidos;
  const prevTasaConversion = prevTotal > 0 ? (prevDealsGanados / prevTotal) * 100 : 0;
  const prevTicketMedio = prevDealsGanados > 0 ? prevValorGanado / prevDealsGanados : 0;

  // Per-vendedor stats
  const vendedores = vendedoresRes.data ?? [];
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
        vendedor: { id: v.id, nombre: v.nombre },
        deals_abiertos: vOpenDeals.length,
        valor_pipeline: vOpenDeals.reduce((s, d) => s + (d.valor ?? 0), 0),
        deals_ganados: vWon.count ?? 0,
        actividades: vAct.count ?? 0,
      };
    })
  );

  return Response.json({
    kpis: {
      total_pipeline_value: openDeals.reduce((s, d) => s + (d.valor ?? 0), 0),
      deals_abiertos: openDeals.length,
      deals_ganados: dealsGanados,
      deals_perdidos: dealsPerdidos,
      tasa_conversion: Math.round(tasaConversion * 10) / 10,
      valor_ganado: valorGanado,
      ticket_medio: Math.round(ticketMedio),
      actividades_periodo: activitiesRes.count ?? 0,
      tareas_vencidas: overdueTasksRes.count ?? 0,
    },
    prev_kpis: {
      deals_ganados: prevDealsGanados,
      valor_ganado: prevValorGanado,
      tasa_conversion: Math.round(prevTasaConversion * 10) / 10,
      ticket_medio: Math.round(prevTicketMedio),
    },
    por_vendedor: porVendedor,
  });
}
