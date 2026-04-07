import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const supabase = await createClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Run queries in parallel
  const [
    openDealsRes,
    pendingTasksRes,
    overdueTasksRes,
    todayActivitiesRes,
    wonDealsRes,
    commissionsRes,
  ] = await Promise.all([
    // Open deals
    supabase
      .from('deals')
      .select('valor')
      .eq('vendedor_asignado', user.id)
      .is('resultado', null),
    // Pending tasks
    supabase
      .from('tareas')
      .select('id', { count: 'exact', head: true })
      .eq('vendedor_asignado', user.id)
      .eq('completada', false),
    // Overdue tasks
    supabase
      .from('tareas')
      .select('id', { count: 'exact', head: true })
      .eq('vendedor_asignado', user.id)
      .eq('completada', false)
      .lt('fecha_vencimiento', todayStart),
    // Activities today
    supabase
      .from('actividades')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .gte('created_at', todayStart),
    // Won deals this month
    supabase
      .from('deals')
      .select('valor')
      .eq('vendedor_asignado', user.id)
      .eq('resultado', 'ganado')
      .gte('cerrado_en', monthStart),
    // Commissions this month
    supabase
      .from('comisiones')
      .select('importe_comision')
      .eq('vendedor_id', user.id)
      .eq('periodo', currentPeriod),
  ]);

  const openDeals = openDealsRes.data ?? [];
  const wonDeals = wonDealsRes.data ?? [];
  const commissions = commissionsRes.data ?? [];

  const kpis = {
    deals_abiertos: openDeals.length,
    valor_pipeline: openDeals.reduce((sum, d) => sum + (d.valor ?? 0), 0),
    tareas_pendientes: pendingTasksRes.count ?? 0,
    tareas_vencidas: overdueTasksRes.count ?? 0,
    actividades_hoy: todayActivitiesRes.count ?? 0,
    deals_ganados_mes: wonDeals.length,
    valor_ganado_mes: wonDeals.reduce((sum, d) => sum + (d.valor ?? 0), 0),
    comision_mes: commissions.reduce((sum, c) => sum + (c.importe_comision ?? 0), 0),
  };

  return Response.json({ kpis });
}
