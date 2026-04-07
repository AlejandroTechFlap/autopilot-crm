/**
 * Dirección framing — adds `teamSize` so the prompt can say "estás liderando
 * un equipo de N vendedores". Single cheap count query.
 */

import { createClient } from '@/lib/supabase/server';
import type { ApiUser } from '@/lib/api-utils';
import { buildBaseContext, type BaseContext } from './base';

export interface DireccionContext extends BaseContext {
  kind: 'direccion';
  userRole: 'direccion';
  teamSize: number;
}

export async function buildDireccionContext(user: ApiUser): Promise<DireccionContext> {
  const base = await buildBaseContext(user);
  const supabase = await createClient();
  const { count } = await supabase
    .from('usuarios')
    .select('id', { count: 'exact', head: true })
    .eq('rol', 'vendedor');

  return {
    ...base,
    kind: 'direccion',
    userRole: 'direccion',
    teamSize: count ?? 0,
  };
}
