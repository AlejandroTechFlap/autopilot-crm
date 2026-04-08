import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserMap } from './users';
import { DEAL_IDS } from './ids';
import { dateOffset, monthOffset } from './seed-date';
import { seedScripts } from './scripts';
import { seedTasks } from './tasks';
import { seedNotifications } from './notifications';
import { seedTenantConfig, seedCustomFieldDefinitions } from './custom-fields';

/**
 * Config seed orchestrator. Groups the small, config-shaped tables
 * (comisiones, kpi_config, kpi_snapshots, notificacion_config) and
 * delegates the larger ones to their own modules (scripts, tasks,
 * notifications, custom-fields) to stay under the 300-line file cap.
 */
export async function seedConfig(supabase: SupabaseClient, users: UserMap) {
  await seedScripts(supabase, users);
  await seedTasks(supabase, users);
  await seedNotifications(supabase, users);
  await seedTenantConfig(supabase);
  await seedCustomFieldDefinitions(supabase);
  await seedCommissions(supabase, users);
  await seedNotificationConfig(supabase, users);
  await seedKpiConfig(supabase);
  await seedKpiSnapshots(supabase);
}

/**
 * Comisiones — 6 rows spread across the last 3 months so the direccion
 * comisiones view has a real trend line. Mixes vendedores so the
 * per-seller breakdown is non-trivial.
 */
async function seedCommissions(supabase: SupabaseClient, users: UserMap) {
  console.log('  Creating commissions...');

  const comisiones = [
    // Current month
    {
      deal_id: DEAL_IDS.MASCOTAS,
      vendedor_id: users.ignacio,
      valor_deal: 60000,
      porcentaje: 5.0,
      importe_comision: 3000,
      periodo: monthOffset(0),
    },
    {
      deal_id: DEAL_IDS.PETCORNER,
      vendedor_id: users.ignacio,
      valor_deal: 90000,
      porcentaje: 5.0,
      importe_comision: 4500,
      periodo: monthOffset(0),
    },
    // Previous month
    {
      deal_id: DEAL_IDS.VETLAB_WON,
      vendedor_id: users.laura,
      valor_deal: 42000,
      porcentaje: 5.0,
      importe_comision: 2100,
      periodo: monthOffset(-1),
    },
    {
      deal_id: DEAL_IDS.ECOPETS_PAST,
      vendedor_id: users.ignacio,
      valor_deal: 52000,
      porcentaje: 4.5,
      importe_comision: 2340,
      periodo: monthOffset(-1),
    },
    // Two months ago — historical synthetic deals
    {
      deal_id: '00000000-0000-0000-0000-0000000000a1',
      vendedor_id: users.rebeca,
      valor_deal: 40000,
      porcentaje: 5.0,
      importe_comision: 2000,
      periodo: monthOffset(-2),
    },
    {
      deal_id: '00000000-0000-0000-0000-0000000000a2',
      vendedor_id: users.laura,
      valor_deal: 55000,
      porcentaje: 5.0,
      importe_comision: 2750,
      periodo: monthOffset(-2),
    },
  ];

  const { error } = await supabase.from('comisiones').upsert(comisiones, { onConflict: 'id' });
  if (error) throw new Error(`Commissions: ${error.message}`);
}

async function seedNotificationConfig(supabase: SupabaseClient, users: UserMap) {
  console.log('  Creating notification config...');

  const configs = [
    { disparador_tipo: 'seguimiento_vencido', activo: true, umbral_horas: 48, canal: 'in_app', destinatario_id: null },
    { disparador_tipo: 'deal_estancado', activo: true, umbral_horas: 72, canal: 'in_app', destinatario_id: users.rebeca },
    { disparador_tipo: 'kpi_rojo', activo: true, umbral_horas: null, canal: 'in_app', destinatario_id: users.rebeca },
  ];

  const { error } = await supabase.from('notificacion_config').upsert(configs, { onConflict: 'id' });
  if (error) throw new Error(`Notification config: ${error.message}`);
}

async function seedKpiConfig(supabase: SupabaseClient) {
  console.log('  Creating KPI config...');

  const kpis = [
    { tipo: 'deals_ganados', umbral_verde: 5, umbral_ambar: 3, objetivo: 8, periodo: 'mensual' },
    { tipo: 'ingresos_cerrados', umbral_verde: 100000, umbral_ambar: 50000, objetivo: 200000, periodo: 'mensual' },
    { tipo: 'llamadas_realizadas', umbral_verde: 40, umbral_ambar: 20, objetivo: 60, periodo: 'mensual' },
    { tipo: 'tasa_conversion', umbral_verde: 30, umbral_ambar: 20, objetivo: 40, periodo: 'mensual' },
    { tipo: 'tiempo_medio_cierre', umbral_verde: 15, umbral_ambar: 25, objetivo: 10, periodo: 'mensual' },
  ];

  const { error } = await supabase.from('kpi_config').upsert(kpis, { onConflict: 'id' });
  if (error) throw new Error(`KPI config: ${error.message}`);
}

/**
 * KPI snapshots — one row per day for the last 30 days, per KPI type,
 * so the dirección historical chart renders a real line (not two points).
 * Values follow a deterministic sine-like drift so the trend is visible
 * but not random.
 */
async function seedKpiSnapshots(supabase: SupabaseClient) {
  console.log('  Creating KPI snapshots...');

  type Spec = { tipo: string; base: number; amplitude: number };
  const specs: Spec[] = [
    { tipo: 'deals_ganados', base: 3, amplitude: 2 },
    { tipo: 'ingresos_cerrados', base: 90000, amplitude: 60000 },
    { tipo: 'llamadas_realizadas', base: 32, amplitude: 14 },
    { tipo: 'tasa_conversion', base: 26, amplitude: 8 },
  ];

  const snapshots: Array<{ kpi_tipo: string; valor: number; fecha: string }> = [];
  for (const spec of specs) {
    for (let d = 0; d < 30; d++) {
      // Deterministic drift: sine over 30 days + small linear trend upward.
      const phase = (d / 30) * Math.PI * 2;
      const drift = Math.round(spec.amplitude * Math.sin(phase));
      const trend = Math.round((d / 30) * spec.amplitude * 0.25);
      snapshots.push({
        kpi_tipo: spec.tipo,
        valor: Math.max(0, spec.base + drift + trend),
        fecha: dateOffset(-(29 - d)),
      });
    }
  }

  const { error } = await supabase.from('kpi_snapshots').upsert(snapshots, { onConflict: 'id' });
  if (error) throw new Error(`KPI snapshots: ${error.message}`);
}
