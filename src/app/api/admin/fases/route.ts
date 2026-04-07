import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';
import type { Json } from '@/types/database';

const CreateFaseSchema = z.object({
  pipeline_id: z.string().uuid(),
  nombre: z.string().min(1).max(120),
  orden: z.number().int().min(1).max(999),
  tiempo_esperado: z.number().int().min(0).nullable().optional(),
  criterios_entrada: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Create a new phase. If `orden` collides with an existing phase, all
 * phases with `orden >= new.orden` are shifted by +1 first.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = CreateFaseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();

  // Check whether `orden` is taken; if so, shift later phases.
  const { data: existing, error: fetchError } = await supabase
    .from('fases')
    .select('id, orden')
    .eq('pipeline_id', parsed.data.pipeline_id)
    .gte('orden', parsed.data.orden)
    .order('orden', { ascending: false });

  if (fetchError) {
    return jsonError('Failed to read existing phases: ' + fetchError.message);
  }

  if (existing && existing.length > 0) {
    // Shift in descending order to avoid UNIQUE collisions.
    for (const fase of existing) {
      const { error: shiftError } = await supabase
        .from('fases')
        .update({ orden: fase.orden + 1 })
        .eq('id', fase.id);
      if (shiftError) {
        return jsonError('Failed to shift phases: ' + shiftError.message);
      }
    }
  }

  const { data, error } = await supabase
    .from('fases')
    .insert({
      pipeline_id: parsed.data.pipeline_id,
      nombre: parsed.data.nombre,
      orden: parsed.data.orden,
      tiempo_esperado: parsed.data.tiempo_esperado ?? null,
      criterios_entrada: (parsed.data.criterios_entrada ?? {}) as Json,
    })
    .select()
    .single();

  if (error || !data) {
    return jsonError('Failed to create phase: ' + (error?.message ?? 'unknown'));
  }

  return Response.json({ fase: data }, { status: 201 });
}
