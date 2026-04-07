import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;

  const faseAsociada = request.nextUrl.searchParams.get('fase_asociada');
  const supabase = await createClient();

  let query = supabase
    .from('scripts')
    .select(`
      id, titulo, contenido, tags, created_at,
      fase:fases!scripts_fase_asociada_fkey(id, nombre)
    `)
    .order('titulo', { ascending: true });

  if (faseAsociada) {
    query = query.eq('fase_asociada', faseAsociada);
  }

  const { data, error } = await query;

  if (error) {
    return jsonError('Failed to load scripts: ' + error.message);
  }

  return Response.json({ scripts: data });
}
