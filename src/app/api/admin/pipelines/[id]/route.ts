import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';

const UpdatePipelineSchema = z.object({
  nombre: z.string().min(1).max(120),
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

  const parsed = UpdatePipelineSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('pipelines')
    .update({ nombre: parsed.data.nombre })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return jsonError('Failed to update pipeline: ' + (error?.message ?? 'unknown'));
  }

  return Response.json({ pipeline: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const supabase = await createClient();

  // Refuse deletion if any deals reference this pipeline.
  const { count, error: countError } = await supabase
    .from('deals')
    .select('id', { count: 'exact', head: true })
    .eq('pipeline_id', id);

  if (countError) {
    return jsonError('Failed to check pipeline usage: ' + countError.message);
  }

  if ((count ?? 0) > 0) {
    return jsonError(
      `Cannot delete pipeline: ${count} deals still reference it`,
      409
    );
  }

  const { error } = await supabase.from('pipelines').delete().eq('id', id);
  if (error) {
    return jsonError('Failed to delete pipeline: ' + error.message);
  }

  return Response.json({ ok: true });
}
