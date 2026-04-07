import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';
import type { Json } from '@/types/database';

const UpdateFaseSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  tiempo_esperado: z.number().int().min(0).nullable().optional(),
  criterios_entrada: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = UpdateFaseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();
  const updates: {
    nombre?: string;
    tiempo_esperado?: number | null;
    criterios_entrada?: Json;
  } = {};
  if (parsed.data.nombre !== undefined) updates.nombre = parsed.data.nombre;
  if (parsed.data.tiempo_esperado !== undefined) {
    updates.tiempo_esperado = parsed.data.tiempo_esperado;
  }
  if (parsed.data.criterios_entrada !== undefined) {
    updates.criterios_entrada = parsed.data.criterios_entrada as Json;
  }

  const { data, error } = await supabase
    .from('fases')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return jsonError('Failed to update phase: ' + (error?.message ?? 'unknown'));
  }

  return Response.json({ fase: data });
}

/**
 * Delete a phase. Refuses if:
 * - It's the only or one of the last two phases in its pipeline (B3).
 * - Any deals still reference this phase (FK protection).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const supabase = await createClient();

  const { data: fase, error: faseError } = await supabase
    .from('fases')
    .select('id, pipeline_id')
    .eq('id', id)
    .single();

  if (faseError || !fase) {
    return jsonError('Phase not found', 404);
  }

  // Invariant B3: pipeline must keep at least 2 phases (initial + final).
  const { count: phaseCount } = await supabase
    .from('fases')
    .select('id', { count: 'exact', head: true })
    .eq('pipeline_id', fase.pipeline_id);

  if ((phaseCount ?? 0) <= 2) {
    return jsonError(
      'Cannot delete: pipeline must keep at least 2 phases (initial + final)',
      409
    );
  }

  const { count: dealCount, error: dealError } = await supabase
    .from('deals')
    .select('id', { count: 'exact', head: true })
    .eq('fase_actual', id);

  if (dealError) {
    return jsonError('Failed to check phase usage: ' + dealError.message);
  }

  if ((dealCount ?? 0) > 0) {
    return jsonError(
      `Cannot delete: ${dealCount} deals are in this phase. Move them first.`,
      409
    );
  }

  const { error } = await supabase.from('fases').delete().eq('id', id);
  if (error) {
    return jsonError('Failed to delete phase: ' + error.message);
  }

  return Response.json({ ok: true });
}
