import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import { z } from 'zod';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;

  const { id } = await params;
  const supabase = await createClient();

  const { data: empresa, error } = await supabase
    .from('empresas')
    .select(`
      *,
      vendedor:usuarios!empresas_vendedor_asignado_fkey(id, nombre, email),
      contactos(id, nombre_completo, cargo, telefono, email, es_principal),
      deals(id, valor, fase_actual, resultado, cerrado_en, fecha_entrada_fase, created_at,
        fase:fases!deals_fase_actual_fkey(nombre, tiempo_esperado))
    `)
    .eq('id', id)
    .single();

  if (error || !empresa) {
    return jsonError('Company not found', 404);
  }

  return Response.json({ empresa });
}

const UpdateEmpresaSchema = z.object({
  nombre: z.string().min(1).optional(),
  lifecycle_stage: z.enum(['lead', 'contactado', 'en_negociacion', 'cliente', 'ex_cliente', 'no_interesa']).optional(),
  fuente_lead: z.enum(['ads', 'organico', 'referido', 'bbdd', 'feria', 'cold_call', 'otro']).optional(),
  prioridad: z.enum(['alta', 'media', 'baja']).nullable().optional(),
  provincia: z.string().nullable().optional(),
  categoria: z.enum(['mascotas', 'veterinaria', 'agro', 'retail', 'servicios', 'otro']).nullable().optional(),
  proxima_accion: z.string().nullable().optional(),
  proxima_accion_fecha: z.string().nullable().optional(),
  notas_internas: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  vendedor_asignado: z.string().uuid().optional(),
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

  const parsed = UpdateEmpresaSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  // Vendedores cannot reassign companies
  if (user.rol === 'vendedor' && parsed.data.vendedor_asignado) {
    return jsonError('Forbidden: cannot reassign company', 403);
  }

  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from('empresas')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return jsonError('Failed to update company: ' + error.message);
  }

  return Response.json({ empresa: updated });
}
