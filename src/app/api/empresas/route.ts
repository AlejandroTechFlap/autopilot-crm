import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, requireApiRole, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const SORTABLE_COLUMNS = new Set([
  'nombre', 'lifecycle_stage', 'fuente_lead', 'prioridad',
  'provincia', 'created_at', 'updated_at', 'proxima_accion_fecha',
]);

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const sp = request.nextUrl.searchParams;
  const search = sp.get('search') ?? '';
  const limit = Math.min(Number(sp.get('limit') ?? '25'), 100);
  const offset = Number(sp.get('offset') ?? '0');
  const sortCol = sp.get('sort') ?? 'updated_at';
  const sortOrder = sp.get('order') === 'asc' ? true : false;
  const lifecycleStage = sp.get('lifecycle_stage') as 'lead' | 'contactado' | 'en_negociacion' | 'cliente' | 'ex_cliente' | 'no_interesa' | null;
  const fuenteLead = sp.get('fuente_lead') as 'ads' | 'organico' | 'referido' | 'bbdd' | 'feria' | 'cold_call' | 'otro' | null;
  const prioridad = sp.get('prioridad') as 'alta' | 'media' | 'baja' | null;
  const vendedorId = sp.get('vendedor_id');

  const supabase = await createClient();

  let query = supabase
    .from('empresas')
    .select(`
      id, nombre, lifecycle_stage, fuente_lead, prioridad, provincia, categoria,
      proxima_accion, proxima_accion_fecha, created_at, updated_at,
      vendedor:usuarios!empresas_vendedor_asignado_fkey(id, nombre)
    `, { count: 'exact' });

  // Vendedores only see their assigned companies
  if (user.rol === 'vendedor') {
    query = query.eq('vendedor_asignado', user.id);
  } else if (vendedorId) {
    query = query.eq('vendedor_asignado', vendedorId);
  }

  if (search) {
    query = query.ilike('nombre', `%${search}%`);
  }

  if (lifecycleStage) {
    query = query.eq('lifecycle_stage', lifecycleStage);
  }
  if (fuenteLead) {
    query = query.eq('fuente_lead', fuenteLead);
  }
  if (prioridad) {
    query = query.eq('prioridad', prioridad);
  }

  const column = SORTABLE_COLUMNS.has(sortCol) ? sortCol : 'updated_at';
  query = query
    .order(column, { ascending: sortOrder })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return jsonError('Failed to load companies: ' + error.message);
  }

  return Response.json({ empresas: data, total: count });
}

const CreateEmpresaSchema = z.object({
  nombre: z.string().min(1),
  fuente_lead: z.enum(['ads', 'organico', 'referido', 'bbdd', 'feria', 'cold_call', 'otro']),
  lifecycle_stage: z.enum(['lead', 'contactado', 'en_negociacion', 'cliente', 'ex_cliente', 'no_interesa']).default('lead'),
  provincia: z.string().optional(),
  categoria: z.enum(['mascotas', 'veterinaria', 'agro', 'retail', 'servicios', 'otro']).optional(),
  descripcion: z.string().optional(),
  informador: z.string().optional(),
  prioridad: z.enum(['alta', 'media', 'baja']).optional(),
  // Required: the creator (admin/direccion) must explicitly assign the new
  // empresa to a vendedor. There is no implicit self-assignment.
  vendedor_asignado: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  // Empresa creation is reserved to admin/direccion. Vendedores get 403.
  // See docs/phase-2-pipeline-company.md → "Lead creation — role gating".
  const auth = await requireApiRole('admin', 'direccion');
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = CreateEmpresaSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();

  const { data: empresa, error } = await supabase
    .from('empresas')
    .insert({
      nombre: parsed.data.nombre,
      fuente_lead: parsed.data.fuente_lead,
      lifecycle_stage: parsed.data.lifecycle_stage,
      provincia: parsed.data.provincia ?? null,
      categoria: parsed.data.categoria ?? null,
      descripcion: parsed.data.descripcion ?? null,
      informador: parsed.data.informador ?? null,
      prioridad: parsed.data.prioridad ?? null,
      vendedor_asignado: parsed.data.vendedor_asignado,
    })
    .select()
    .single();

  if (error || !empresa) {
    return jsonError('Failed to create company: ' + (error?.message ?? 'unknown'));
  }

  // Log creation as system activity
  await supabase.from('actividades').insert({
    empresa_id: empresa.id,
    tipo: 'sistema',
    contenido: `Company created: ${empresa.nombre}`,
    usuario_id: user.id,
  });

  return Response.json({ empresa }, { status: 201 });
}
