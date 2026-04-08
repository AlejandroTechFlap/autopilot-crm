import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';
import { assertFeatureFlag } from '@/features/tenant/lib/feature-flag-guard';

const UpdateScriptSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  contenido: z.string().min(1).optional(),
  fase_asociada: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const blocked = await assertFeatureFlag('feat_admin_scripts');
  if (blocked) return blocked;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = UpdateScriptSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scripts')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return jsonError(
      'Failed to update script: ' + (error?.message ?? 'unknown')
    );
  }

  return Response.json({ script: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const blocked = await assertFeatureFlag('feat_admin_scripts');
  if (blocked) return blocked;

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from('scripts').delete().eq('id', id);
  if (error) {
    return jsonError('Failed to delete script: ' + error.message);
  }

  return Response.json({ ok: true });
}
