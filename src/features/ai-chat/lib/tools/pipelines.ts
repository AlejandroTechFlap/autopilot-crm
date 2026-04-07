/**
 * Pipeline / fase lookup. The model uses this to map phase names mentioned
 * by the user (e.g. "negociación") to phase IDs that other tools accept.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type Supabase = SupabaseClient<Database>;

export async function getPipelinesFases(supabase: Supabase) {
  const [pipelinesRes, fasesRes] = await Promise.all([
    supabase.from('pipelines').select('id, nombre').order('nombre'),
    supabase
      .from('fases')
      .select('id, nombre, orden, tiempo_esperado, criterios_entrada, pipeline_id')
      .order('orden', { ascending: true }),
  ]);

  if (pipelinesRes.error) return { error: pipelinesRes.error.message };
  if (fasesRes.error) return { error: fasesRes.error.message };

  const pipelines = (pipelinesRes.data ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    fases: (fasesRes.data ?? []).filter((f) => f.pipeline_id === p.id),
  }));

  return { pipelines };
}
