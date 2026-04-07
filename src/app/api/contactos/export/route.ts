import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;

  const sp = request.nextUrl.searchParams;
  const search = sp.get('search') ?? '';

  const supabase = await createClient();

  let query = supabase
    .from('contactos')
    .select(`
      nombre_completo, cargo, telefono, email, es_principal, created_at,
      empresa:empresas!contactos_empresa_id_fkey(nombre)
    `)
    .order('nombre_completo', { ascending: true });

  if (search) query = query.ilike('nombre_completo', `%${search}%`);

  const { data, error } = await query;

  if (error) {
    return jsonError('Failed to export: ' + error.message);
  }

  const headers = ['Name', 'Position', 'Phone', 'Email', 'Primary', 'Company', 'Created'];

  const rows = (data ?? []).map((c) => [
    csvEscape(c.nombre_completo),
    csvEscape(c.cargo ?? ''),
    c.telefono ?? '',
    c.email ?? '',
    c.es_principal ? 'Yes' : 'No',
    csvEscape((c.empresa as { nombre: string } | null)?.nombre ?? ''),
    c.created_at.split('T')[0],
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="contactos.csv"',
    },
  });
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
