/**
 * Admin framing — adds `teamSize`, `pipelinesCount`, `scriptsCount` so the
 * operations-analyst prompt can open with a system snapshot ("supervisas un
 * CRM con N pipelines, M scripts y un equipo de K vendedores").
 */

import { createClient } from '@/lib/supabase/server';
import type { ApiUser } from '@/lib/api-utils';
import { buildBaseContext, type BaseContext } from './base';

export interface AdminContext extends BaseContext {
  kind: 'admin';
  userRole: 'admin';
  teamSize: number;
  pipelinesCount: number;
  scriptsCount: number;
}

export async function buildAdminContext(user: ApiUser): Promise<AdminContext> {
  const base = await buildBaseContext(user);
  const supabase = await createClient();

  const [team, pipelines, scripts] = await Promise.all([
    supabase
      .from('usuarios')
      .select('id', { count: 'exact', head: true })
      .eq('rol', 'vendedor'),
    supabase.from('pipelines').select('id', { count: 'exact', head: true }),
    supabase.from('scripts').select('id', { count: 'exact', head: true }),
  ]);

  return {
    ...base,
    kind: 'admin',
    userRole: 'admin',
    teamSize: team.count ?? 0,
    pipelinesCount: pipelines.count ?? 0,
    scriptsCount: scripts.count ?? 0,
  };
}
