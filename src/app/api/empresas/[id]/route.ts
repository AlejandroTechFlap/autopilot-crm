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

  // Capture the previous vendedor so we can tell whether this PATCH is
  // actually changing ownership (and thus whether we need to cascade to
  // open deals — see below).
  const newVendedorId = parsed.data.vendedor_asignado;
  let previousVendedorId: string | null = null;
  if (newVendedorId) {
    const { data: current } = await supabase
      .from('empresas')
      .select('vendedor_asignado')
      .eq('id', id)
      .single();
    previousVendedorId = current?.vendedor_asignado ?? null;
  }

  const { data: updated, error } = await supabase
    .from('empresas')
    .update(parsed.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return jsonError('Failed to update company: ' + error.message);
  }

  // Cascade vendedor reassignment to OPEN deals on this empresa.
  // Without this, the child deals would retain the previous vendedor and
  // vendedor-scoped RLS would then hide the empresa from the deal's
  // new-empresa-owner (or the old deal-owner). Closed deals (resultado set)
  // keep their historical vendedor so MTD/prev-MTD KPI attribution stays
  // accurate.
  if (newVendedorId && previousVendedorId && newVendedorId !== previousVendedorId) {
    const { error: cascadeError } = await supabase
      .from('deals')
      .update({ vendedor_asignado: newVendedorId })
      .eq('empresa_id', id)
      .is('resultado', null);

    if (cascadeError) {
      console.error(
        `[empresas/${id}] vendedor cascade to open deals failed:`,
        cascadeError.message
      );
      return jsonError(
        'Company updated but failed to reassign open deals: ' + cascadeError.message,
        500
      );
    }
  }

  return Response.json({ empresa: updated });
}
