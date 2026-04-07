import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;

  const { id: empresaId } = await params;
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get('limit') ?? '30'),
    100
  );

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('actividades')
    .select(`
      id, tipo, contenido, created_at,
      usuario:usuarios!actividades_usuario_id_fkey(id, nombre),
      contacto:contactos!actividades_contacto_id_fkey(id, nombre_completo),
      deal:deals!actividades_deal_id_fkey(id, valor)
    `)
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return jsonError('Failed to load activities: ' + error.message);
  }

  return Response.json({ actividades: data });
}

const CreateActividadSchema = z.object({
  tipo: z.enum(['llamada', 'nota', 'reunion']),
  contenido: z.string().min(1),
  contacto_id: z.string().uuid().optional(),
  deal_id: z.string().uuid().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const { id: empresaId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const parsed = CreateActividadSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('actividades')
    .insert({
      empresa_id: empresaId,
      tipo: parsed.data.tipo,
      contenido: parsed.data.contenido,
      contacto_id: parsed.data.contacto_id ?? null,
      deal_id: parsed.data.deal_id ?? null,
      usuario_id: user.id,
    })
    .select('id, tipo, contenido, created_at')
    .single();

  if (error) {
    return jsonError('Failed to create activity: ' + error.message);
  }

  return Response.json({ actividad: data }, { status: 201 });
}
