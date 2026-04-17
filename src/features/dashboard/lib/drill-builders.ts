import type { DrillData, DrillItem, DrillVendedorRow } from '../types';
import { formatCurrency } from '@/lib/formatting';
import { aggregateByVendedor, DRILL_LIMIT, pickOne, type Db } from './drill';

export async function buildPipelineValueDrill(db: Db): Promise<DrillData> {
  const { data } = await db
    .from('deals')
    .select(
      'id, valor, fecha_entrada_fase, empresa:empresas!deals_empresa_id_fkey(id, nombre), vendedor:usuarios!deals_vendedor_asignado_fkey(id, nombre), fase:fases!deals_fase_actual_fkey(nombre)'
    )
    .is('resultado', null)
    .order('valor', { ascending: false });

  const rows = data ?? [];
  const total = rows.reduce((s, r) => s + (r.valor ?? 0), 0);
  const avg = rows.length > 0 ? total / rows.length : 0;

  const items: DrillItem[] = rows.slice(0, DRILL_LIMIT).map((r) => {
    const empresa = pickOne(r.empresa);
    const vendedor = pickOne(r.vendedor);
    const fase = pickOne(r.fase);
    return {
      id: r.id,
      primary: empresa?.nombre ?? 'Sin nombre',
      secondary: fase?.nombre ?? null,
      vendedor: vendedor?.nombre ?? null,
      valor: r.valor ?? 0,
      date: r.fecha_entrada_fase,
      href: empresa?.id ? `/empresa/${empresa.id}` : null,
    };
  });

  const byVendRows = rows.map((r) => {
    const v = pickOne(r.vendedor);
    return {
      vendedor_id: v?.id ?? 'unknown',
      vendedor_nombre: v?.nombre ?? 'Sin vendedor',
      valor: r.valor ?? 0,
    };
  });

  return {
    title: 'Desglose del embudo',
    summary: [
      { label: 'Embudo total', value: formatCurrency(total) },
      { label: 'Oportunidades abiertas', value: String(rows.length) },
      { label: 'Ticket medio', value: formatCurrency(Math.round(avg)) },
    ],
    by_vendedor: aggregateByVendedor(byVendRows),
    items,
  };
}

export async function buildDealsGanadosDrill(
  db: Db,
  periodStart: string
): Promise<DrillData> {
  const { data } = await db
    .from('deals')
    .select(
      'id, valor, cerrado_en, empresa:empresas!deals_empresa_id_fkey(id, nombre), vendedor:usuarios!deals_vendedor_asignado_fkey(id, nombre)'
    )
    .eq('resultado', 'ganado')
    .gte('cerrado_en', periodStart)
    .order('valor', { ascending: false });

  const rows = data ?? [];
  const total = rows.reduce((s, r) => s + (r.valor ?? 0), 0);
  const avg = rows.length > 0 ? total / rows.length : 0;

  const items: DrillItem[] = rows.slice(0, DRILL_LIMIT).map((r) => {
    const empresa = pickOne(r.empresa);
    const vendedor = pickOne(r.vendedor);
    return {
      id: r.id,
      primary: empresa?.nombre ?? 'Sin nombre',
      secondary: 'Ganado',
      vendedor: vendedor?.nombre ?? null,
      valor: r.valor ?? 0,
      date: r.cerrado_en,
      href: empresa?.id ? `/empresa/${empresa.id}` : null,
    };
  });

  const byVendRows = rows.map((r) => {
    const v = pickOne(r.vendedor);
    return {
      vendedor_id: v?.id ?? 'unknown',
      vendedor_nombre: v?.nombre ?? 'Sin vendedor',
      valor: r.valor ?? 0,
    };
  });

  return {
    title: 'Desglose de ganados',
    summary: [
      { label: 'Ganados', value: String(rows.length) },
      { label: 'Valor total', value: formatCurrency(total) },
      { label: 'Ticket medio', value: formatCurrency(Math.round(avg)) },
    ],
    by_vendedor: aggregateByVendedor(byVendRows),
    items,
  };
}

export async function buildConversionDrill(
  db: Db,
  periodStart: string
): Promise<DrillData> {
  const { data } = await db
    .from('deals')
    .select(
      'id, valor, resultado, motivo_perdida, cerrado_en, empresa:empresas!deals_empresa_id_fkey(id, nombre), vendedor:usuarios!deals_vendedor_asignado_fkey(id, nombre)'
    )
    .not('resultado', 'is', null)
    .gte('cerrado_en', periodStart);

  const rows = data ?? [];
  const won = rows.filter((r) => r.resultado === 'ganado');
  const lost = rows.filter((r) => r.resultado === 'perdido');
  const rate = rows.length > 0 ? (won.length / rows.length) * 100 : 0;

  const byVendor = new Map<
    string,
    { vendedor_id: string; vendedor: string; ganados: number; perdidos: number }
  >();
  for (const r of rows) {
    const v = pickOne(r.vendedor);
    if (!v) continue;
    const acc = byVendor.get(v.id) ?? {
      vendedor_id: v.id,
      vendedor: v.nombre,
      ganados: 0,
      perdidos: 0,
    };
    if (r.resultado === 'ganado') acc.ganados += 1;
    else acc.perdidos += 1;
    byVendor.set(v.id, acc);
  }

  const by_vendedor: DrillVendedorRow[] = Array.from(byVendor.values())
    .map((v) => {
      const total = v.ganados + v.perdidos;
      return {
        vendedor_id: v.vendedor_id,
        vendedor: v.vendedor,
        count: total,
        ganados: v.ganados,
        perdidos: v.perdidos,
        rate: total > 0 ? Math.round((v.ganados / total) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));

  // Items: lost deals with motivos (most actionable for conversion analysis)
  const items: DrillItem[] = lost.slice(0, DRILL_LIMIT).map((r) => {
    const empresa = pickOne(r.empresa);
    const vendedor = pickOne(r.vendedor);
    return {
      id: r.id,
      primary: empresa?.nombre ?? 'Sin nombre',
      secondary: r.motivo_perdida ?? 'Sin motivo registrado',
      vendedor: vendedor?.nombre ?? null,
      valor: r.valor ?? 0,
      date: r.cerrado_en,
      href: empresa?.id ? `/empresa/${empresa.id}` : null,
    };
  });

  return {
    title: 'Desglose de conversión',
    summary: [
      { label: 'Ganados', value: String(won.length) },
      { label: 'Perdidos', value: String(lost.length) },
      { label: 'Conversión', value: `${Math.round(rate * 10) / 10}%` },
    ],
    by_vendedor,
    items,
  };
}

export async function buildTicketMedioDrill(
  db: Db,
  periodStart: string
): Promise<DrillData> {
  const drill = await buildDealsGanadosDrill(db, periodStart);
  const valores = drill.items
    .map((i) => i.valor)
    .filter((v): v is number => typeof v === 'number');
  const max = valores.length > 0 ? Math.max(...valores) : 0;
  const min = valores.length > 0 ? Math.min(...valores) : 0;
  const avg = valores.length > 0
    ? Math.round(valores.reduce((s, v) => s + v, 0) / valores.length)
    : 0;

  return {
    ...drill,
    title: 'Desglose del ticket medio',
    summary: [
      { label: 'Medio', value: formatCurrency(avg) },
      { label: 'Máximo', value: formatCurrency(max) },
      { label: 'Mínimo', value: formatCurrency(min) },
    ],
  };
}

export async function buildOverdueTasksDrill(db: Db): Promise<DrillData> {
  const todayStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  ).toISOString();

  const { data } = await db
    .from('tareas')
    .select(
      'id, titulo, fecha_vencimiento, empresa:empresas!tareas_empresa_id_fkey(id, nombre), vendedor:usuarios!tareas_vendedor_asignado_fkey(id, nombre)'
    )
    .eq('completada', false)
    .lt('fecha_vencimiento', todayStart)
    .order('fecha_vencimiento', { ascending: true });

  const rows = data ?? [];
  const today = new Date();

  const items: DrillItem[] = rows.slice(0, DRILL_LIMIT).map((r) => {
    const empresa = pickOne(r.empresa);
    const vendedor = pickOne(r.vendedor);
    const due = r.fecha_vencimiento ? new Date(r.fecha_vencimiento) : null;
    const daysOverdue = due
      ? Math.floor((today.getTime() - due.getTime()) / 86_400_000)
      : 0;
    return {
      id: r.id,
      primary: r.titulo,
      secondary: empresa?.nombre
        ? `${empresa.nombre} · ${daysOverdue}d de retraso`
        : `${daysOverdue}d de retraso`,
      vendedor: vendedor?.nombre ?? null,
      valor: null,
      date: r.fecha_vencimiento,
      href: empresa?.id ? `/empresa/${empresa.id}` : null,
    };
  });

  const byVendor = new Map<
    string,
    { vendedor_id: string; vendedor: string; count: number }
  >();
  for (const r of rows) {
    const v = pickOne(r.vendedor);
    if (!v) continue;
    const acc = byVendor.get(v.id) ?? {
      vendedor_id: v.id,
      vendedor: v.nombre,
      count: 0,
    };
    acc.count += 1;
    byVendor.set(v.id, acc);
  }

  return {
    title: 'Desglose de tareas vencidas',
    summary: [{ label: 'Vencidas', value: String(rows.length) }],
    by_vendedor: Array.from(byVendor.values()).sort((a, b) => b.count - a.count),
    items,
  };
}
