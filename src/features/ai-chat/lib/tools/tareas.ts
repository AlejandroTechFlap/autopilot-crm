/**
 * Task lookup tool. Supports filtering by completion status, "overdue only",
 * vendedor, empresa, and a fuzzy match on the title. Orders by due date so
 * the model sees the most urgent items first.
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { buildFuzzyOr, clampLimit, todayStartIso } from './helpers';

type Supabase = SupabaseClient<Database>;

const Prioridad = z.enum(['alta', 'media', 'baja']);

export const SearchTareasSchema = z.object({
  query: z.string().optional(),
  completada: z.boolean().optional(),
  vencidas_only: z.boolean().optional(),
  vendedor_id: z.string().uuid().optional(),
  empresa_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  prioridad: Prioridad.optional(),
  limit: z.number().int().optional(),
});
export type SearchTareasInput = z.infer<typeof SearchTareasSchema>;

export async function searchTareas(input: SearchTareasInput, supabase: Supabase) {
  const limit = clampLimit(input.limit);

  let q = supabase
    .from('tareas')
    .select(
      `id,
       titulo,
       descripcion,
       prioridad,
       fecha_vencimiento,
       completada,
       tipo_tarea,
       origen,
       vendedor:usuarios!tareas_vendedor_asignado_fkey(id, nombre),
       empresa:empresas(id, nombre),
       deal:deals(id, valor)`
    )
    .order('fecha_vencimiento', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (typeof input.completada === 'boolean') q = q.eq('completada', input.completada);
  if (input.vendedor_id) q = q.eq('vendedor_asignado', input.vendedor_id);
  if (input.empresa_id) q = q.eq('empresa_id', input.empresa_id);
  if (input.deal_id) q = q.eq('deal_id', input.deal_id);
  if (input.prioridad) q = q.eq('prioridad', input.prioridad);

  if (input.vencidas_only) {
    q = q.eq('completada', false).lt('fecha_vencimiento', todayStartIso());
  }

  if (input.query) {
    const fuzzy = buildFuzzyOr('titulo', input.query);
    if (fuzzy) q = q.or(fuzzy);
  }

  const { data, error } = await q;
  if (error) return { error: error.message };
  return { tareas: data ?? [], count: data?.length ?? 0 };
}
