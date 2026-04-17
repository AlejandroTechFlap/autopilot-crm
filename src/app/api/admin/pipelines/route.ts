import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pipelines')
    .select(`
      id, nombre, created_at,
      fases(id, nombre, orden, tiempo_esperado, criterios_entrada)
    `)
    .order('created_at', { ascending: true });

  if (error) {
    return jsonError('Failed to load pipelines: ' + error.message);
  }

  // Sort phases by orden inside each pipeline (Postgres returns them
  // unordered when nested).
  const pipelines = (data ?? []).map((p) => ({
    ...p,
    fases: [...(p.fases ?? [])].sort((a, b) => a.orden - b.orden),
  }));

  return Response.json({ pipelines });
}

const CreatePipelineSchema = z.object({
  nombre: z.string().min(1).max(120),
});

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = CreatePipelineSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();
  const { data: pipeline, error } = await supabase
    .from('pipelines')
    .insert({ nombre: parsed.data.nombre, created_by: auth.id })
    .select()
    .single();

  if (error || !pipeline) {
    return jsonError('No se ha podido crear el embudo: ' + (error?.message ?? 'desconocido'));
  }

  // Seed two phases so invariant B3 (initial + final phase always exist)
  // can never be violated by deleting the only phase.
  const { error: fasesError } = await supabase.from('fases').insert([
    { pipeline_id: pipeline.id, nombre: 'Inicio', orden: 1, tiempo_esperado: 1 },
    { pipeline_id: pipeline.id, nombre: 'Cerrado', orden: 99, tiempo_esperado: null },
  ]);

  if (fasesError) {
    return jsonError('Embudo creado, pero las fases iniciales han fallado: ' + fasesError.message);
  }

  return Response.json({ pipeline }, { status: 201 });
}
