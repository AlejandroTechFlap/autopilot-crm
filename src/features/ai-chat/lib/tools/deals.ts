/**
 * Deal lookup tools.
 *
 * `searchDeals` joins `empresas(nombre)` so the model gets human-readable
 * results. Fuzzy `query` matches against the related empresa name. Filters:
 * fase, resultado (won/lost/null=open), vendedor, valor_min.
 *
 * `getDeal` returns a single deal with empresa, vendedor, and recent activity
 * for narrative-style answers.
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { clampLimit } from './helpers';
import { buildCite } from './citation';

type Supabase = SupabaseClient<Database>;

const Resultado = z.enum(['ganado', 'perdido']);

export const SearchDealsSchema = z.object({
  query: z.string().optional(),
  fase_id: z.string().uuid().optional(),
  pipeline_id: z.string().uuid().optional(),
  resultado: z.union([Resultado, z.literal('open')]).optional(),
  vendedor_id: z.string().uuid().optional(),
  empresa_id: z.string().uuid().optional(),
  valor_min: z.number().nonnegative().optional(),
  estancados_dias: z.number().int().positive().optional(),
  limit: z.number().int().optional(),
});
export type SearchDealsInput = z.infer<typeof SearchDealsSchema>;

export const GetDealSchema = z.object({
  id: z.string().uuid(),
});
export type GetDealInput = z.infer<typeof GetDealSchema>;

export async function searchDeals(input: SearchDealsInput, supabase: Supabase) {
  const limit = clampLimit(input.limit);

  let q = supabase
    .from('deals')
    .select(
      `id,
       valor,
       fecha_entrada_fase,
       resultado,
       motivo_perdida,
       cerrado_en,
       empresa:empresas(id, nombre, lifecycle_stage, provincia),
       fase:fases(id, nombre, orden),
       vendedor:usuarios!deals_vendedor_asignado_fkey(id, nombre)`
    )
    .order('fecha_entrada_fase', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (input.fase_id) q = q.eq('fase_actual', input.fase_id);
  if (input.pipeline_id) q = q.eq('pipeline_id', input.pipeline_id);
  if (input.vendedor_id) q = q.eq('vendedor_asignado', input.vendedor_id);
  if (input.empresa_id) q = q.eq('empresa_id', input.empresa_id);
  if (typeof input.valor_min === 'number') q = q.gte('valor', input.valor_min);

  if (input.resultado === 'open') {
    q = q.is('resultado', null);
  } else if (input.resultado) {
    q = q.eq('resultado', input.resultado);
  }

  if (input.estancados_dias) {
    const cutoff = new Date(
      Date.now() - input.estancados_dias * 86_400_000
    ).toISOString();
    q = q.lt('fecha_entrada_fase', cutoff).is('resultado', null);
  }

  const { data, error } = await q;
  if (error) return { error: error.message };

  let deals = data ?? [];

  // Fuzzy filter by empresa name in-memory because Supabase .or() across a
  // joined table requires PostgREST embedded filters that don't compose with
  // the rest of the query as cleanly as a post-filter does at this scale.
  if (input.query) {
    const needle = input.query.toLowerCase();
    deals = deals.filter((d) =>
      (d.empresa?.nombre ?? '').toLowerCase().includes(needle)
    );
  }

  const dealsWithCite = deals.map((d) => ({
    ...d,
    cite: buildCite(
      'deal',
      d.id,
      d.empresa?.nombre ? `${d.empresa.nombre} · deal` : 'deal',
      d.empresa?.id ?? null,
    ),
  }));
  return { deals: dealsWithCite, count: dealsWithCite.length };
}

export async function getDeal(input: GetDealInput, supabase: Supabase) {
  const { data: deal, error } = await supabase
    .from('deals')
    .select(
      `id,
       valor,
       fecha_entrada_fase,
       resultado,
       motivo_perdida,
       cerrado_en,
       created_at,
       empresa:empresas(id, nombre, lifecycle_stage, provincia, prioridad, proxima_accion, proxima_accion_fecha),
       fase:fases(id, nombre, orden, tiempo_esperado),
       pipeline:pipelines(id, nombre),
       vendedor:usuarios!deals_vendedor_asignado_fkey(id, nombre)`
    )
    .eq('id', input.id)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!deal) return { error: 'deal no encontrado' };

  const { data: actividades } = await supabase
    .from('actividades')
    .select(
      `id,
       tipo,
       contenido,
       created_at,
       usuario:usuarios(id, nombre)`
    )
    .eq('deal_id', input.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const empresaId = deal.empresa?.id ?? null;
  const dealWithCite = {
    ...deal,
    cite: buildCite(
      'deal',
      deal.id,
      deal.empresa?.nombre ? `${deal.empresa.nombre} · deal` : 'deal',
      empresaId,
    ),
  };
  const actividades_recientes = (actividades ?? []).map((a) => ({
    ...a,
    cite: buildCite('actividad', a.id, a.tipo, empresaId),
  }));
  return {
    deal: dealWithCite,
    actividades_recientes,
  };
}
