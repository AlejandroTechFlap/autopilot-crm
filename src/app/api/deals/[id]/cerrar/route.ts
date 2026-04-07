import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import { z } from 'zod';

const CerrarSchema = z.object({
  resultado: z.enum(['ganado', 'perdido']),
  motivo_perdida: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const { id: dealId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = CerrarSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('resultado (ganado|perdido) is required');
  }

  const { resultado, motivo_perdida } = parsed.data;
  const supabase = await createClient();

  // Get current deal
  const { data: deal } = await supabase
    .from('deals')
    .select('id, empresa_id, vendedor_asignado, resultado')
    .eq('id', dealId)
    .single();

  if (!deal) {
    return jsonError('Deal not found', 404);
  }

  if (deal.resultado) {
    return jsonError('Deal is already closed');
  }

  if (user.rol === 'vendedor' && deal.vendedor_asignado !== user.id) {
    return jsonError('Forbidden', 403);
  }

  // Close deal
  const { data: updated, error } = await supabase
    .from('deals')
    .update({
      resultado,
      cerrado_en: new Date().toISOString(),
      motivo_perdida: resultado === 'perdido' ? (motivo_perdida ?? null) : null,
    })
    .eq('id', dealId)
    .select()
    .single();

  if (error) {
    return jsonError('Failed to close deal: ' + error.message);
  }

  // If won, update empresa lifecycle_stage
  if (resultado === 'ganado') {
    await supabase
      .from('empresas')
      .update({ lifecycle_stage: 'cliente' })
      .eq('id', deal.empresa_id);
  }

  // Log activity
  const label = resultado === 'ganado' ? 'Deal won' : 'Deal lost';
  const content = motivo_perdida
    ? `${label}. Reason: ${motivo_perdida}`
    : label;

  await supabase.from('actividades').insert({
    empresa_id: deal.empresa_id,
    deal_id: dealId,
    tipo: 'sistema',
    contenido: content,
    usuario_id: user.id,
  });

  return Response.json({ deal: updated });
}
