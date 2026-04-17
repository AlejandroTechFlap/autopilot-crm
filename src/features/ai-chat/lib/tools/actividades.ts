/**
 * Activity log lookup tool. Reads from the `actividades` table — the
 * timeline that backs every empresa / deal detail page. Useful for
 * "what's been happening with X" style questions.
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { clampLimit } from './helpers';
import { buildCite } from './citation';

type Supabase = SupabaseClient<Database>;

const TipoActividad = z.enum(['llamada', 'nota', 'reunion', 'cambio_fase', 'sistema']);

export const GetActividadesSchema = z.object({
  empresa_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  contacto_id: z.string().uuid().optional(),
  usuario_id: z.string().uuid().optional(),
  tipo: TipoActividad.optional(),
  since: z.string().datetime().optional(),
  limit: z.number().int().optional(),
});
export type GetActividadesInput = z.infer<typeof GetActividadesSchema>;

export async function getActividades(
  input: GetActividadesInput,
  supabase: Supabase
) {
  const limit = clampLimit(input.limit);

  let q = supabase
    .from('actividades')
    .select(
      `id,
       tipo,
       contenido,
       created_at,
       empresa:empresas(id, nombre),
       deal:deals(id, valor),
       contacto:contactos(id, nombre_completo),
       usuario:usuarios(id, nombre)`
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (input.empresa_id) q = q.eq('empresa_id', input.empresa_id);
  if (input.deal_id) q = q.eq('deal_id', input.deal_id);
  if (input.contacto_id) q = q.eq('contacto_id', input.contacto_id);
  if (input.usuario_id) q = q.eq('usuario_id', input.usuario_id);
  if (input.tipo) q = q.eq('tipo', input.tipo);
  if (input.since) q = q.gte('created_at', input.since);

  const { data, error } = await q;
  if (error) return { error: error.message };
  const actividades = (data ?? []).map((a) => ({
    ...a,
    cite: buildCite('actividad', a.id, a.tipo, a.empresa?.id ?? null),
  }));
  return { actividades, count: actividades.length };
}
