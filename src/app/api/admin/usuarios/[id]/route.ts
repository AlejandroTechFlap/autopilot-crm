import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';

const UpdateUsuarioSchema = z.object({
  nombre: z.string().min(1).max(120).optional(),
  rol: z.enum(['admin', 'direccion', 'vendedor']).optional(),
});

/**
 * Update a user's name or role.
 *
 * Refuses if it would leave the system without any admin (the caller cannot
 * demote themselves to a non-admin while being the last admin standing).
 */
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

  const parsed = UpdateUsuarioSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();

  // Guard: never strip the last admin.
  if (parsed.data.rol && parsed.data.rol !== 'admin') {
    const { count, error: countError } = await supabase
      .from('usuarios')
      .select('id', { count: 'exact', head: true })
      .eq('rol', 'admin')
      .neq('id', id);

    if (countError) {
      return jsonError('Failed to check admin count: ' + countError.message);
    }

    if ((count ?? 0) === 0) {
      return jsonError(
        'Cannot demote: at least one admin must remain in the system',
        409
      );
    }
  }

  const { data, error } = await supabase
    .from('usuarios')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return jsonError(
      'Failed to update user: ' + (error?.message ?? 'unknown')
    );
  }

  return Response.json({ usuario: data });
}
