import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';
import { assertFeatureFlag } from '@/features/tenant/lib/feature-flag-guard';

const CreateScriptSchema = z.object({
  titulo: z.string().min(1).max(200),
  contenido: z.string().min(1),
  fase_asociada: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

/** GET — list all scripts (admin view, includes phase name). */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const blocked = await assertFeatureFlag('feat_admin_scripts');
  if (blocked) return blocked;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scripts')
    .select(
      `
      id, titulo, contenido, tags, fase_asociada, created_at,
      fase:fases!scripts_fase_asociada_fkey(id, nombre)
    `
    )
    .order('titulo', { ascending: true });

  if (error) {
    return jsonError('Failed to load scripts: ' + error.message);
  }

  return Response.json({ scripts: data ?? [] });
}

/** POST — create a script. */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const blocked = await assertFeatureFlag('feat_admin_scripts');
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = CreateScriptSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scripts')
    .insert({
      titulo: parsed.data.titulo,
      contenido: parsed.data.contenido,
      fase_asociada: parsed.data.fase_asociada ?? null,
      tags: parsed.data.tags ?? [],
      created_by: auth.id,
    })
    .select()
    .single();

  if (error || !data) {
    return jsonError(
      'Failed to create script: ' + (error?.message ?? 'unknown')
    );
  }

  return Response.json({ script: data }, { status: 201 });
}
