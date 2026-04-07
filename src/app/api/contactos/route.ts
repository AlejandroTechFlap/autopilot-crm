import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;

  const sp = request.nextUrl.searchParams;
  const search = sp.get('search') ?? '';
  const empresaId = sp.get('empresa_id');
  const limit = Math.min(Number(sp.get('limit') ?? '25'), 100);
  const offset = Number(sp.get('offset') ?? '0');
  const sortCol = sp.get('sort') ?? 'nombre_completo';
  const sortOrder = sp.get('order') === 'desc' ? false : true;

  const supabase = await createClient();

  let query = supabase
    .from('contactos')
    .select(`
      id, nombre_completo, cargo, telefono, email, es_principal, created_at,
      empresa:empresas!contactos_empresa_id_fkey(id, nombre)
    `, { count: 'exact' });

  if (search) {
    query = query.ilike('nombre_completo', `%${search}%`);
  }
  if (empresaId) {
    query = query.eq('empresa_id', empresaId);
  }

  const validCols = new Set(['nombre_completo', 'cargo', 'email', 'created_at']);
  const column = validCols.has(sortCol) ? sortCol : 'nombre_completo';
  query = query
    .order(column, { ascending: sortOrder })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return jsonError('Failed to load contacts: ' + error.message);
  }

  return Response.json({ contactos: data, total: count });
}

const CreateContactoSchema = z.object({
  empresa_id: z.string().uuid(),
  nombre_completo: z.string().min(1),
  cargo: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  es_principal: z.boolean().default(false),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = CreateContactoSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('contactos')
    .insert({
      empresa_id: parsed.data.empresa_id,
      nombre_completo: parsed.data.nombre_completo,
      cargo: parsed.data.cargo ?? null,
      telefono: parsed.data.telefono ?? null,
      email: parsed.data.email ?? null,
      es_principal: parsed.data.es_principal,
    })
    .select()
    .single();

  if (error) {
    return jsonError('Failed to create contact: ' + error.message);
  }

  return Response.json({ contacto: data }, { status: 201 });
}
