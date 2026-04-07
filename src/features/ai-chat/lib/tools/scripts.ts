/**
 * Script lookup tools.
 *
 * `searchScripts` returns lightweight metadata + a 500-char excerpt so the
 * model can decide which script to fetch in full.
 *
 * `getScript` returns the full content capped at MAX_SCRIPT_CONTENT chars
 * (token-budget guard — scripts rarely exceed this).
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { buildFuzzyOr, clampLimit, MAX_SCRIPT_CONTENT } from './helpers';

type Supabase = SupabaseClient<Database>;

export const SearchScriptsSchema = z.object({
  query: z.string().optional(),
  fase_id: z.string().uuid().optional(),
  tag: z.string().optional(),
  limit: z.number().int().optional(),
});
export type SearchScriptsInput = z.infer<typeof SearchScriptsSchema>;

export const GetScriptSchema = z.object({
  id: z.string().uuid(),
});
export type GetScriptInput = z.infer<typeof GetScriptSchema>;

export async function searchScripts(input: SearchScriptsInput, supabase: Supabase) {
  const limit = clampLimit(input.limit);

  let q = supabase
    .from('scripts')
    .select(
      `id,
       titulo,
       contenido,
       tags,
       fase:fases(id, nombre)`
    )
    .order('titulo', { ascending: true })
    .limit(limit);

  if (input.fase_id) q = q.eq('fase_asociada', input.fase_id);
  if (input.tag) q = q.contains('tags', [input.tag]);

  if (input.query) {
    const fuzzy = buildFuzzyOr('titulo', input.query);
    if (fuzzy) q = q.or(fuzzy);
  }

  const { data, error } = await q;
  if (error) return { error: error.message };

  const scripts = (data ?? []).map((s) => ({
    id: s.id,
    titulo: s.titulo,
    fase: s.fase,
    tags: s.tags,
    excerpt: s.contenido ? s.contenido.slice(0, 500) : '',
  }));

  return { scripts, count: scripts.length };
}

export async function getScript(input: GetScriptInput, supabase: Supabase) {
  const { data, error } = await supabase
    .from('scripts')
    .select(
      `id,
       titulo,
       contenido,
       tags,
       fase:fases(id, nombre)`
    )
    .eq('id', input.id)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: 'script no encontrado' };

  const contenido = data.contenido ?? '';
  return {
    script: {
      id: data.id,
      titulo: data.titulo,
      fase: data.fase,
      tags: data.tags,
      contenido: contenido.slice(0, MAX_SCRIPT_CONTENT),
      truncado: contenido.length > MAX_SCRIPT_CONTENT,
    },
  };
}
