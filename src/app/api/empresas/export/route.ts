import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const sp = request.nextUrl.searchParams;
  const search = sp.get('search') ?? '';
  const lifecycleStage = sp.get('lifecycle_stage') as 'lead' | 'contactado' | 'en_negociacion' | 'cliente' | 'ex_cliente' | 'no_interesa' | null;
  const fuenteLead = sp.get('fuente_lead') as 'ads' | 'organico' | 'referido' | 'bbdd' | 'feria' | 'cold_call' | 'otro' | null;
  const prioridad = sp.get('prioridad') as 'alta' | 'media' | 'baja' | null;

  const supabase = await createClient();

  let query = supabase
    .from('empresas')
    .select(`
      nombre, lifecycle_stage, fuente_lead, prioridad, provincia,
      categoria, proxima_accion, proxima_accion_fecha, created_at,
      vendedor:usuarios!empresas_vendedor_asignado_fkey(nombre)
    `)
    .order('nombre', { ascending: true });

  if (user.rol === 'vendedor') {
    query = query.eq('vendedor_asignado', user.id);
  }
  if (search) query = query.ilike('nombre', `%${search}%`);
  if (lifecycleStage) query = query.eq('lifecycle_stage', lifecycleStage);
  if (fuenteLead) query = query.eq('fuente_lead', fuenteLead);
  if (prioridad) query = query.eq('prioridad', prioridad);

  const { data, error } = await query;

  if (error) {
    return jsonError('Failed to export: ' + error.message);
  }

  const headers = [
    'Name', 'Lifecycle', 'Source', 'Priority', 'Province',
    'Category', 'Next Action', 'Next Action Date', 'Seller', 'Created',
  ];

  const rows = (data ?? []).map((e) => [
    csvEscape(e.nombre),
    e.lifecycle_stage,
    e.fuente_lead,
    e.prioridad ?? '',
    e.provincia ?? '',
    e.categoria ?? '',
    csvEscape(e.proxima_accion ?? ''),
    e.proxima_accion_fecha ?? '',
    (e.vendedor as { nombre: string } | null)?.nombre ?? '',
    e.created_at.split('T')[0],
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="empresas.csv"',
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
