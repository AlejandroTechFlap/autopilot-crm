import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { DrillData, DrillType, DrillVendedorRow } from '../types';
import {
  buildPipelineValueDrill,
  buildDealsGanadosDrill,
  buildConversionDrill,
  buildTicketMedioDrill,
  buildOverdueTasksDrill,
} from './drill-builders';

export type Db = SupabaseClient<Database>;

export const DRILL_LIMIT = 10;

export function getPeriodStart(periodo: string): string {
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

interface VendedorAcc {
  vendedor_id: string;
  vendedor: string;
  count: number;
  valor: number;
}

export function aggregateByVendedor(
  rows: { vendedor_id: string; vendedor_nombre: string; valor: number }[]
): DrillVendedorRow[] {
  const map = new Map<string, VendedorAcc>();
  for (const r of rows) {
    const acc = map.get(r.vendedor_id) ?? {
      vendedor_id: r.vendedor_id,
      vendedor: r.vendedor_nombre,
      count: 0,
      valor: 0,
    };
    acc.count += 1;
    acc.valor += r.valor;
    map.set(r.vendedor_id, acc);
  }
  return Array.from(map.values()).sort((a, b) => b.valor - a.valor);
}

/**
 * Unwrap a Supabase relation that may come back as either a single row or
 * a one-element array, depending on the FK shape.
 */
export function pickOne<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

export async function buildDrill(
  db: Db,
  tipo: DrillType,
  periodo: string
): Promise<DrillData> {
  const periodStart = getPeriodStart(periodo);
  switch (tipo) {
    case 'pipeline_value':
      return buildPipelineValueDrill(db);
    case 'deals_ganados':
      return buildDealsGanadosDrill(db, periodStart);
    case 'conversion':
      return buildConversionDrill(db, periodStart);
    case 'ticket_medio':
      return buildTicketMedioDrill(db, periodStart);
    case 'tareas_vencidas':
      return buildOverdueTasksDrill(db);
  }
}
