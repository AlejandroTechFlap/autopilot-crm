/**
 * Contact lookup tool. Fuzzy match against name and email, optional filter
 * by empresa. RLS scopes results to the calling user automatically.
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { buildFuzzyOrMulti, clampLimit } from './helpers';

type Supabase = SupabaseClient<Database>;

export const SearchContactosSchema = z.object({
  query: z.string().optional(),
  empresa_id: z.string().uuid().optional(),
  es_principal: z.boolean().optional(),
  limit: z.number().int().optional(),
});
export type SearchContactosInput = z.infer<typeof SearchContactosSchema>;

export async function searchContactos(
  input: SearchContactosInput,
  supabase: Supabase
) {
  const limit = clampLimit(input.limit);

  let q = supabase
    .from('contactos')
    .select(
      `id,
       nombre_completo,
       cargo,
       email,
       telefono,
       es_principal,
       empresa:empresas(id, nombre)`
    )
    .order('es_principal', { ascending: false })
    .order('nombre_completo', { ascending: true })
    .limit(limit);

  if (input.empresa_id) q = q.eq('empresa_id', input.empresa_id);
  if (typeof input.es_principal === 'boolean') {
    q = q.eq('es_principal', input.es_principal);
  }

  if (input.query) {
    const fuzzy = buildFuzzyOrMulti(['nombre_completo', 'email'], input.query);
    if (fuzzy) q = q.or(fuzzy);
  }

  const { data, error } = await q;
  if (error) return { error: error.message };
  return { contactos: data ?? [], count: data?.length ?? 0 };
}
