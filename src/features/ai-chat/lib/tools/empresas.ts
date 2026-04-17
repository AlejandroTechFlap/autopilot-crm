/**
 * Empresa lookup tools.
 *
 * `searchEmpresas` is the workhorse: fuzzy ilike on `nombre`, optional filters
 * for lifecycle stage / vendedor / priority. RLS handles row-level security
 * automatically — a vendedor only sees their own assignments.
 *
 * `getEmpresa` returns the full empresa row + nested contactos / open deals /
 * recent actividades for deep dives.
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { buildFuzzyOr, clampLimit } from './helpers';
import { buildCite } from './citation';

type Supabase = SupabaseClient<Database>;

const LifecycleStage = z.enum([
  'lead',
  'contactado',
  'en_negociacion',
  'cliente',
  'ex_cliente',
  'no_interesa',
]);
const Prioridad = z.enum(['alta', 'media', 'baja']);

export const SearchEmpresasSchema = z.object({
  query: z.string().optional(),
  lifecycle_stage: LifecycleStage.optional(),
  vendedor_id: z.string().uuid().optional(),
  prioridad: Prioridad.optional(),
  sin_vendedor: z.boolean().optional(),
  limit: z.number().int().optional(),
});
export type SearchEmpresasInput = z.infer<typeof SearchEmpresasSchema>;

export const GetEmpresaSchema = z.object({
  id: z.string().uuid(),
});
export type GetEmpresaInput = z.infer<typeof GetEmpresaSchema>;

export async function searchEmpresas(input: SearchEmpresasInput, supabase: Supabase) {
  const limit = clampLimit(input.limit);

  let q = supabase
    .from('empresas')
    .select(
      `id,
       nombre,
       lifecycle_stage,
       prioridad,
       proxima_accion,
       proxima_accion_fecha,
       provincia,
       categoria,
       vendedor:usuarios!empresas_vendedor_asignado_fkey(id, nombre)`
    )
    .order('prioridad', { ascending: false, nullsFirst: false })
    .order('proxima_accion_fecha', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (input.lifecycle_stage) q = q.eq('lifecycle_stage', input.lifecycle_stage);
  if (input.prioridad) q = q.eq('prioridad', input.prioridad);
  if (input.vendedor_id) q = q.eq('vendedor_asignado', input.vendedor_id);
  if (input.sin_vendedor) q = q.is('vendedor_asignado', null);

  if (input.query) {
    const fuzzy = buildFuzzyOr('nombre', input.query);
    if (fuzzy) q = q.or(fuzzy);
  }

  const { data, error } = await q;
  if (error) return { error: error.message };
  const empresas = (data ?? []).map((e) => ({
    ...e,
    cite: buildCite('empresa', e.id, e.nombre),
  }));
  return { empresas, count: empresas.length };
}

export async function getEmpresa(input: GetEmpresaInput, supabase: Supabase) {
  const { data: empresa, error } = await supabase
    .from('empresas')
    .select(
      `id,
       nombre,
       lifecycle_stage,
       prioridad,
       proxima_accion,
       proxima_accion_fecha,
       fuente_lead,
       categoria,
       provincia,
       notas_internas,
       etiquetas,
       created_at,
       vendedor:usuarios!empresas_vendedor_asignado_fkey(id, nombre)`
    )
    .eq('id', input.id)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!empresa) return { error: 'empresa no encontrada' };

  const [contactosRes, dealsRes, actividadesRes] = await Promise.all([
    supabase
      .from('contactos')
      .select('id, nombre_completo, cargo, email, telefono, es_principal')
      .eq('empresa_id', input.id)
      .order('es_principal', { ascending: false })
      .limit(10),
    supabase
      .from('deals')
      .select(
        `id,
         valor,
         fecha_entrada_fase,
         resultado,
         fase:fases(id, nombre)`
      )
      .eq('empresa_id', input.id)
      .is('resultado', null)
      .order('fecha_entrada_fase', { ascending: false })
      .limit(10),
    supabase
      .from('actividades')
      .select(
        `id,
         tipo,
         contenido,
         created_at,
         usuario:usuarios(id, nombre)`
      )
      .eq('empresa_id', input.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const empresaWithCite = {
    ...empresa,
    cite: buildCite('empresa', empresa.id, empresa.nombre),
  };
  const contactos = (contactosRes.data ?? []).map((c) => ({
    ...c,
    cite: buildCite('contacto', c.id, c.nombre_completo, input.id),
  }));
  const deals_abiertos = (dealsRes.data ?? []).map((d) => ({
    ...d,
    cite: buildCite('deal', d.id, `${empresa.nombre} · deal`, input.id),
  }));
  const actividades_recientes = (actividadesRes.data ?? []).map((a) => ({
    ...a,
    cite: buildCite('actividad', a.id, a.tipo, input.id),
  }));

  return {
    empresa: empresaWithCite,
    contactos,
    deals_abiertos,
    actividades_recientes,
  };
}
