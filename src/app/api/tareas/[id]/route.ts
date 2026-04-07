import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import { z } from 'zod';

const UpdateTareaSchema = z.object({
  titulo: z.string().min(1).optional(),
  descripcion: z.string().nullable().optional(),
  prioridad: z.enum(['alta', 'media', 'baja']).optional(),
  fecha_vencimiento: z.string().nullable().optional(),
  completada: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = UpdateTareaSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();

  // Verify task exists and user has access
  const { data: existing } = await supabase
    .from('tareas')
    .select('id, titulo, empresa_id, vendedor_asignado')
    .eq('id', id)
    .single();

  if (!existing) {
    return jsonError('Task not found', 404);
  }

  if (user.rol === 'vendedor' && existing.vendedor_asignado !== user.id) {
    return jsonError('Forbidden', 403);
  }

  const { data: updated, error } = await supabase
    .from('tareas')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return jsonError('Failed to update task: ' + error.message);
  }

  // If marking as completed, log activity on linked empresa
  if (parsed.data.completada === true && existing.empresa_id) {
    await supabase.from('actividades').insert({
      empresa_id: existing.empresa_id,
      tipo: 'sistema',
      contenido: `Task completed: ${existing.titulo}`,
      usuario_id: user.id,
    });
  }

  return Response.json({ tarea: updated });
}
