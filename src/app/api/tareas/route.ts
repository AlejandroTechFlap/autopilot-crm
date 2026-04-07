import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const sp = request.nextUrl.searchParams;
  const completada = sp.get('completada') !== 'true';
  const prioridad = sp.get('prioridad') as 'alta' | 'media' | 'baja' | null;
  const vendedorId = sp.get('vendedor_id');
  const empresaId = sp.get('empresa_id');
  const limit = Math.min(Number(sp.get('limit') ?? '50'), 100);

  const supabase = await createClient();

  let query = supabase
    .from('tareas')
    .select(`
      id, titulo, descripcion, prioridad, fecha_vencimiento,
      completada, origen, tipo_tarea, created_at, updated_at,
      empresa:empresas!tareas_empresa_id_fkey(id, nombre),
      deal:deals!tareas_deal_id_fkey(id, valor)
    `, { count: 'exact' })
    .eq('completada', !completada)
    .order('fecha_vencimiento', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  // Vendedor sees own tasks only
  if (user.rol === 'vendedor') {
    query = query.eq('vendedor_asignado', user.id);
  } else if (vendedorId) {
    query = query.eq('vendedor_asignado', vendedorId);
  }

  if (prioridad) {
    query = query.eq('prioridad', prioridad);
  }

  if (empresaId) {
    query = query.eq('empresa_id', empresaId);
  }

  const { data, error, count } = await query;

  if (error) {
    return jsonError('Failed to load tasks: ' + error.message);
  }

  return Response.json({ tareas: data, count });
}

const CreateTareaSchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().optional(),
  prioridad: z.enum(['alta', 'media', 'baja']).default('media'),
  fecha_vencimiento: z.string().optional(),
  empresa_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
  vendedor_asignado: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = CreateTareaSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  // Vendedores can only create tasks for themselves
  if (user.rol === 'vendedor' && parsed.data.vendedor_asignado !== user.id) {
    return jsonError('Forbidden: cannot assign tasks to others', 403);
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tareas')
    .insert({
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion ?? null,
      prioridad: parsed.data.prioridad,
      fecha_vencimiento: parsed.data.fecha_vencimiento ?? null,
      empresa_id: parsed.data.empresa_id ?? null,
      deal_id: parsed.data.deal_id ?? null,
      vendedor_asignado: parsed.data.vendedor_asignado,
      origen: 'manual',
    })
    .select()
    .single();

  if (error) {
    return jsonError('Failed to create task: ' + error.message);
  }

  return Response.json({ tarea: data }, { status: 201 });
}
