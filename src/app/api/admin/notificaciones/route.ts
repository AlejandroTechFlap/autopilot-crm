import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';

/** GET — list all notification rules. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notificacion_config')
    .select(
      'id, disparador_tipo, canal, umbral_horas, activo, horario_inicio, horario_fin, destinatario_id'
    )
    .order('disparador_tipo', { ascending: true });

  if (error) {
    return jsonError('Failed to load rules: ' + error.message);
  }

  return Response.json({ reglas: data ?? [] });
}

const RuleUpdateSchema = z.object({
  id: z.string().uuid(),
  activo: z.boolean().optional(),
  canal: z.enum(['in_app', 'email', 'slack']).optional(),
  umbral_horas: z.number().int().min(0).nullable().optional(),
});

const BulkPatchSchema = z.object({
  reglas: z.array(RuleUpdateSchema),
});

/** PATCH — bulk-update notification rules (one round-trip from the editor). */
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  const json = await request.json().catch(() => null);
  const parsed = BulkPatchSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError('Invalid payload', 400);
  }

  const supabase = await createClient();

  for (const rule of parsed.data.reglas) {
    const { id, ...updates } = rule;
    const { error } = await supabase
      .from('notificacion_config')
      .update(updates)
      .eq('id', id);
    if (error) {
      return jsonError(`Failed to update ${id}: ${error.message}`);
    }
  }

  return Response.json({ ok: true });
}
