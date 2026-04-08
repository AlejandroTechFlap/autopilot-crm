import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserMap } from './users';
import { PIPELINE_ID, FASE_IDS, EMPRESA_IDS, DEAL_IDS } from './ids';
import { dayOffset } from './seed-date';
import { buildHistoryDeals } from './deals-history';

export async function seedDeals(supabase: SupabaseClient, users: UserMap) {
  console.log('  Creating deals...');

  const deals = [
    // PetShop Madrid — Nuevo Lead, green (entered today)
    {
      id: DEAL_IDS.PETSHOP,
      empresa_id: EMPRESA_IDS.PETSHOP_MADRID,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.NUEVO_LEAD,
      valor: 25000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: dayOffset(0, 8),
      created_at: dayOffset(-12, 10),
    },
    // VetPartners — Negociacion, RED (22 days in 7-day phase!)
    {
      id: DEAL_IDS.VETPARTNERS,
      empresa_id: EMPRESA_IDS.VETPARTNERS,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.NEGOCIACION,
      valor: 85000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: dayOffset(-22, 9),
      created_at: dayOffset(-27, 9),
    },
    // AgroVet — Contacto Inicial, amber (2 days in 2-day phase)
    {
      id: DEAL_IDS.AGROVET,
      empresa_id: EMPRESA_IDS.AGROVET,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.CONTACTO_INICIAL,
      valor: 45000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: dayOffset(-2, 15),
      created_at: dayOffset(-17, 11),
    },
    // Mascotas Felices — Postventa, WON
    {
      id: DEAL_IDS.MASCOTAS,
      empresa_id: EMPRESA_IDS.MASCOTAS_FELICES,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 60000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: dayOffset(-12, 16),
      resultado: 'ganado',
      cerrado_en: dayOffset(-12, 16),
      created_at: dayOffset(-32, 10),
    },
    // PetFood Express — Nuevo Lead, amber (1 day in 1-day phase)
    {
      id: DEAL_IDS.PETFOOD,
      empresa_id: EMPRESA_IDS.PETFOOD_EXPRESS,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.NUEVO_LEAD,
      valor: 15000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: dayOffset(-1, 10),
      created_at: dayOffset(-3, 14),
    },
    // Clinica Sol — Propuesta Enviada, amber (4 days in 5-day phase = 80%)
    {
      id: DEAL_IDS.CLINICA,
      empresa_id: EMPRESA_IDS.CLINICA_SOL,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.PROPUESTA,
      valor: 120000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: dayOffset(-4, 14),
      created_at: dayOffset(-22, 9),
    },
    // Animalia — Contacto Inicial, green (1 day in 2-day phase = 50%)
    {
      id: DEAL_IDS.ANIMALIA,
      empresa_id: EMPRESA_IDS.ANIMALIA,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.CONTACTO_INICIAL,
      valor: 35000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: dayOffset(-1, 10),
      created_at: dayOffset(-15, 10),
    },
    // VetSalud — Nuevo Lead, green (entered today)
    {
      id: DEAL_IDS.VETSALUD,
      empresa_id: EMPRESA_IDS.VETSALUD,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.NUEVO_LEAD,
      valor: 50000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: dayOffset(0, 8),
      created_at: dayOffset(-5, 8),
    },
    // PetCorner — Postventa, WON (Phase 10 — custom fields populated)
    {
      id: DEAL_IDS.PETCORNER,
      empresa_id: EMPRESA_IDS.PETCORNER,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 90000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: dayOffset(-27, 10),
      resultado: 'ganado',
      cerrado_en: dayOffset(-27, 10),
      created_at: dayOffset(-45, 10),
      campos_personalizados: { fuente_lead: 'referido', probabilidad_cierre: 100 },
    },
    // ZooRetail — Nuevo Lead, amber (1 day in 1-day phase)
    {
      id: DEAL_IDS.ZOORETAIL,
      empresa_id: EMPRESA_IDS.ZOORETAIL,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.NUEVO_LEAD,
      valor: 20000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: dayOffset(-1, 12),
      created_at: dayOffset(-2, 12),
    },
    // Nutrivet — Propuesta, LOST
    {
      id: DEAL_IDS.NUTRIVET,
      empresa_id: EMPRESA_IDS.NUTRIVET,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.PROPUESTA,
      valor: 30000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: dayOffset(-22, 9),
      resultado: 'perdido',
      motivo_perdida: 'Sin presupuesto disponible',
      cerrado_en: dayOffset(-17, 15),
      created_at: dayOffset(-36, 9),
    },
    // ===== Phase "Mock Data Overhaul" — coverage additions =====
    // ECOPETS — active reactivation, Nuevo Lead (green, fresh)
    {
      id: DEAL_IDS.ECOPETS,
      empresa_id: EMPRESA_IDS.ECOPETS,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.NUEVO_LEAD,
      valor: 38000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: dayOffset(0, 11),
      created_at: dayOffset(0, 11),
    },
    // ECOPETS_PAST — historical closed-won (75 days ago, before previous month)
    {
      id: DEAL_IDS.ECOPETS_PAST,
      empresa_id: EMPRESA_IDS.ECOPETS,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 52000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: dayOffset(-75, 14),
      resultado: 'ganado',
      cerrado_en: dayOffset(-75, 14),
      created_at: dayOffset(-90, 11),
    },
    // VETNORTE — Contacto Inicial, amber (3 days in 2-day phase)
    {
      id: DEAL_IDS.VETNORTE,
      empresa_id: EMPRESA_IDS.VETNORTE,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.CONTACTO_INICIAL,
      valor: 28000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: dayOffset(-3, 9),
      created_at: dayOffset(-10, 10),
    },
    // MASCOTAS_SUR — Nuevo Lead (just entered, green)
    {
      id: DEAL_IDS.MASCOTAS_SUR,
      empresa_id: EMPRESA_IDS.MASCOTAS_SUR,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.NUEVO_LEAD,
      valor: 18000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: dayOffset(-1, 15),
      created_at: dayOffset(-7, 9),
    },
    // PETBOUTIQUE — Cierre phase (fills coverage gap — no other deal currently in Cierre)
    {
      id: DEAL_IDS.PETBOUTIQUE,
      empresa_id: EMPRESA_IDS.PETBOUTIQUE,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.CIERRE,
      valor: 75000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: dayOffset(-2, 10),
      created_at: dayOffset(-60, 10),
    },
    // VETLAB_WON — closed-won (50 days ago, within previous month)
    {
      id: DEAL_IDS.VETLAB_WON,
      empresa_id: EMPRESA_IDS.VETLAB,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 42000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: dayOffset(-50, 11),
      resultado: 'ganado',
      cerrado_en: dayOffset(-50, 11),
      created_at: dayOffset(-80, 10),
    },
    // VETLAB_LOST — closed-lost in Propuesta (25 days ago)
    {
      id: DEAL_IDS.VETLAB_LOST,
      empresa_id: EMPRESA_IDS.VETLAB,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.PROPUESTA,
      valor: 35000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: dayOffset(-30, 10),
      resultado: 'perdido',
      motivo_perdida: 'Precio fuera de presupuesto para segunda compra',
      cerrado_en: dayOffset(-25, 15),
      created_at: dayOffset(-40, 9),
      // Phase 10 — custom fields populated on 2 deals (per plan)
      campos_personalizados: { fuente_lead: 'referido', probabilidad_cierre: 20 },
    },
    ...buildHistoryDeals(users),
  ];

  // `campos_personalizados` is NOT NULL — inject empty default for rows
  // that don't set it explicitly (Supabase bulk upsert sends missing keys as null).
  const rows = deals.map((d) => ({ campos_personalizados: {}, ...d }));
  const { error } = await supabase.from('deals').upsert(rows);
  if (error) throw new Error(`Deals: ${error.message}`);
}
