import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import type { NextRequest } from 'next/server';
import { assertFeatureFlag } from '@/features/tenant/lib/feature-flag-guard';

function getPeriodDays(periodo: string): number {
  switch (periodo) {
    case '7d': return 7;
    case 'quarter': return 90;
    case 'month':
    default: return 30;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  if (user.rol === 'vendedor') {
    return jsonError('Forbidden', 403);
  }

  const blocked = await assertFeatureFlag('feat_dashboard_historico');
  if (blocked) return blocked;

  const sp = request.nextUrl.searchParams;
  const tipo = sp.get('tipo') ?? 'pipeline_value';
  const periodo = sp.get('periodo') ?? 'month';
  const days = getPeriodDays(periodo);

  const supabase = await createClient();

  // Try kpi_snapshots first
  const periodStart = new Date(Date.now() - days * 86_400_000)
    .toISOString()
    .split('T')[0];

  const { data: snapshots } = await supabase
    .from('kpi_snapshots')
    .select('fecha, valor')
    .eq('kpi_tipo', tipo)
    .gte('fecha', periodStart)
    .order('fecha', { ascending: true });

  if (snapshots && snapshots.length > 0) {
    return Response.json({ series: snapshots });
  }

  // Fallback: compute live from deals/activities
  const series = await computeLiveSeries(supabase, tipo, days);

  return Response.json({ series });
}

async function computeLiveSeries(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tipo: string,
  days: number
): Promise<{ fecha: string; valor: number }[]> {
  const now = new Date();
  const result: { fecha: string; valor: number }[] = [];

  if (tipo === 'deals_ganados') {
    const start = new Date(now.getTime() - days * 86_400_000).toISOString();
    const { data } = await supabase
      .from('deals')
      .select('cerrado_en')
      .eq('resultado', 'ganado')
      .gte('cerrado_en', start);

    // Group by date
    const counts: Record<string, number> = {};
    for (const d of data ?? []) {
      if (d.cerrado_en) {
        const date = d.cerrado_en.split('T')[0];
        counts[date] = (counts[date] ?? 0) + 1;
      }
    }

    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86_400_000)
        .toISOString()
        .split('T')[0];
      result.push({ fecha: date, valor: counts[date] ?? 0 });
    }
  } else if (tipo === 'actividades') {
    const start = new Date(now.getTime() - days * 86_400_000).toISOString();
    const { data } = await supabase
      .from('actividades')
      .select('created_at')
      .gte('created_at', start);

    const counts: Record<string, number> = {};
    for (const a of data ?? []) {
      const date = a.created_at.split('T')[0];
      counts[date] = (counts[date] ?? 0) + 1;
    }

    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86_400_000)
        .toISOString()
        .split('T')[0];
      result.push({ fecha: date, valor: counts[date] ?? 0 });
    }
  } else if (tipo === 'conversion') {
    // Daily conversion rate = ganados / (ganados + perdidos), per day.
    // Days with no closes show 0 (not "no data") to keep the line continuous.
    const start = new Date(now.getTime() - days * 86_400_000).toISOString();
    const { data } = await supabase
      .from('deals')
      .select('cerrado_en, resultado')
      .in('resultado', ['ganado', 'perdido'])
      .gte('cerrado_en', start);

    const won: Record<string, number> = {};
    const lost: Record<string, number> = {};
    for (const d of data ?? []) {
      if (!d.cerrado_en) continue;
      const date = d.cerrado_en.split('T')[0];
      if (d.resultado === 'ganado') won[date] = (won[date] ?? 0) + 1;
      else lost[date] = (lost[date] ?? 0) + 1;
    }

    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86_400_000)
        .toISOString()
        .split('T')[0];
      const w = won[date] ?? 0;
      const l = lost[date] ?? 0;
      const total = w + l;
      const rate = total > 0 ? Math.round((w / total) * 1000) / 10 : 0;
      result.push({ fecha: date, valor: rate });
    }
  } else {
    // pipeline_value — flat line from current open-pipeline value (no history table yet)
    const { data } = await supabase
      .from('deals')
      .select('valor')
      .is('resultado', null);

    const totalValue = (data ?? []).reduce((s, d) => s + (d.valor ?? 0), 0);

    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86_400_000)
        .toISOString()
        .split('T')[0];
      result.push({ fecha: date, valor: totalValue });
    }
  }

  return result;
}
