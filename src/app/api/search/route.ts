import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import type { NextRequest } from 'next/server';

const MAX_PER_CATEGORY = 5;

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const limit = rateLimit(`search:${user.id}`, 60, 60_000);
  if (!limit.ok) return rateLimitResponse(limit);

  const q = request.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) {
    return Response.json({ empresas: [], contactos: [], deals: [] });
  }

  const supabase = await createClient();
  const pattern = `%${q}%`;
  const isVendedor = user.rol === 'vendedor';

  // Run all three searches in parallel
  const [empresasRes, contactosRes, dealsRes] = await Promise.all([
    (() => {
      let query = supabase
        .from('empresas')
        .select('id, nombre, lifecycle_stage, provincia')
        .ilike('nombre', pattern)
        .limit(MAX_PER_CATEGORY);
      if (isVendedor) query = query.eq('vendedor_asignado', user.id);
      return query;
    })(),

    supabase
      .from('contactos')
      .select('id, nombre_completo, cargo, empresa_id, empresa:empresas!contactos_empresa_id_fkey(nombre)')
      .ilike('nombre_completo', pattern)
      .limit(MAX_PER_CATEGORY),

    (() => {
      let query = supabase
        .from('deals')
        .select('id, valor, resultado, empresa:empresas!deals_empresa_id_fkey(id, nombre)')
        .ilike('empresa.nombre', pattern)
        .limit(MAX_PER_CATEGORY);
      if (isVendedor) query = query.eq('vendedor_asignado', user.id);
      return query;
    })(),
  ]);

  if (empresasRes.error || contactosRes.error || dealsRes.error) {
    return jsonError('Search failed');
  }

  return Response.json({
    empresas: empresasRes.data ?? [],
    contactos: contactosRes.data ?? [],
    deals: (dealsRes.data ?? []).filter((d) => d.empresa !== null),
  });
}
