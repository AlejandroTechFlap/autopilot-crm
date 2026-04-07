import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserMap } from './users';
import { PIPELINE_ID, FASE_IDS, EMPRESA_IDS, DEAL_IDS } from './ids';

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
      fecha_entrada_fase: '2026-04-06T08:00:00Z',
      created_at: '2026-03-25T10:00:00Z',
    },
    // VetPartners — Negociacion, RED (22 days in 7-day phase!)
    {
      id: DEAL_IDS.VETPARTNERS,
      empresa_id: EMPRESA_IDS.VETPARTNERS,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.NEGOCIACION,
      valor: 85000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: '2026-03-15T09:00:00Z',
      created_at: '2026-03-10T09:00:00Z',
    },
    // AgroVet — Contacto Inicial, amber (2 days in 2-day phase)
    {
      id: DEAL_IDS.AGROVET,
      empresa_id: EMPRESA_IDS.AGROVET,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.CONTACTO_INICIAL,
      valor: 45000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: '2026-04-04T15:00:00Z',
      created_at: '2026-03-20T11:00:00Z',
    },
    // Mascotas Felices — Postventa, WON
    {
      id: DEAL_IDS.MASCOTAS,
      empresa_id: EMPRESA_IDS.MASCOTAS_FELICES,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 60000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: '2026-03-25T16:00:00Z',
      resultado: 'ganado',
      cerrado_en: '2026-03-25T16:00:00Z',
      created_at: '2026-03-05T10:00:00Z',
    },
    // PetFood Express — Nuevo Lead, amber (1 day in 1-day phase)
    {
      id: DEAL_IDS.PETFOOD,
      empresa_id: EMPRESA_IDS.PETFOOD_EXPRESS,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.NUEVO_LEAD,
      valor: 15000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: '2026-04-05T10:00:00Z',
      created_at: '2026-04-03T14:00:00Z',
    },
    // Clinica Sol — Propuesta Enviada, amber (4 days in 5-day phase = 80%)
    {
      id: DEAL_IDS.CLINICA,
      empresa_id: EMPRESA_IDS.CLINICA_SOL,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.PROPUESTA,
      valor: 120000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: '2026-04-02T14:00:00Z',
      created_at: '2026-03-15T09:00:00Z',
    },
    // Animalia — Contacto Inicial, green (1 day in 2-day phase = 50%)
    {
      id: DEAL_IDS.ANIMALIA,
      empresa_id: EMPRESA_IDS.ANIMALIA,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.CONTACTO_INICIAL,
      valor: 35000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: '2026-04-05T10:00:00Z',
      created_at: '2026-03-22T10:00:00Z',
    },
    // VetSalud — Nuevo Lead, green (entered today)
    {
      id: DEAL_IDS.VETSALUD,
      empresa_id: EMPRESA_IDS.VETSALUD,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.NUEVO_LEAD,
      valor: 50000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: '2026-04-06T08:00:00Z',
      created_at: '2026-04-01T08:00:00Z',
    },
    // PetCorner — Postventa, WON
    {
      id: DEAL_IDS.PETCORNER,
      empresa_id: EMPRESA_IDS.PETCORNER,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 90000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: '2026-03-10T10:00:00Z',
      resultado: 'ganado',
      cerrado_en: '2026-03-10T10:00:00Z',
      created_at: '2026-02-20T10:00:00Z',
    },
    // ZooRetail — Nuevo Lead, amber (1 day in 1-day phase)
    {
      id: DEAL_IDS.ZOORETAIL,
      empresa_id: EMPRESA_IDS.ZOORETAIL,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.NUEVO_LEAD,
      valor: 20000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: '2026-04-05T12:00:00Z',
      created_at: '2026-04-04T12:00:00Z',
    },
    // Nutrivet — Propuesta, LOST
    {
      id: DEAL_IDS.NUTRIVET,
      empresa_id: EMPRESA_IDS.NUTRIVET,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.PROPUESTA,
      valor: 30000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: '2026-03-15T09:00:00Z',
      resultado: 'perdido',
      motivo_perdida: 'Sin presupuesto disponible',
      cerrado_en: '2026-03-20T15:00:00Z',
      created_at: '2026-03-01T09:00:00Z',
    },
    // --- Synthetic history so MTD-vs-prev-MTD deltas are non-trivial ---
    // Previous month-to-date (1–6 March) — wins
    {
      id: '00000000-0000-0000-0000-0000000000a1',
      empresa_id: EMPRESA_IDS.PETSHOP_MADRID,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 40000,
      vendedor_asignado: users.rebeca,
      fecha_entrada_fase: '2026-03-03T10:00:00Z',
      resultado: 'ganado',
      cerrado_en: '2026-03-03T10:00:00Z',
      created_at: '2026-02-15T10:00:00Z',
    },
    {
      id: '00000000-0000-0000-0000-0000000000a2',
      empresa_id: EMPRESA_IDS.VETPARTNERS,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 55000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: '2026-03-05T11:00:00Z',
      resultado: 'ganado',
      cerrado_en: '2026-03-05T11:00:00Z',
      created_at: '2026-02-18T10:00:00Z',
    },
    // Previous month-to-date (1–6 March) — loss
    {
      id: '00000000-0000-0000-0000-0000000000a3',
      empresa_id: EMPRESA_IDS.AGROVET,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.PROPUESTA,
      valor: 18000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: '2026-02-25T09:00:00Z',
      resultado: 'perdido',
      motivo_perdida: 'Eligió competidor',
      cerrado_en: '2026-03-04T15:00:00Z',
      created_at: '2026-02-20T09:00:00Z',
    },
    // Current month-to-date (1–6 April) — wins so April has signal
    {
      id: '00000000-0000-0000-0000-0000000000b1',
      empresa_id: EMPRESA_IDS.PETFOOD_EXPRESS,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 48000,
      vendedor_asignado: users.rebeca,
      fecha_entrada_fase: '2026-04-02T11:00:00Z',
      resultado: 'ganado',
      cerrado_en: '2026-04-02T11:00:00Z',
      created_at: '2026-03-18T10:00:00Z',
    },
    {
      id: '00000000-0000-0000-0000-0000000000b2',
      empresa_id: EMPRESA_IDS.ANIMALIA,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 72000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: '2026-04-04T16:00:00Z',
      resultado: 'ganado',
      cerrado_en: '2026-04-04T16:00:00Z',
      created_at: '2026-03-22T10:00:00Z',
    },
    // Current month-to-date — loss
    {
      id: '00000000-0000-0000-0000-0000000000b3',
      empresa_id: EMPRESA_IDS.ZOORETAIL,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.PROPUESTA,
      valor: 22000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: '2026-03-28T10:00:00Z',
      resultado: 'perdido',
      motivo_perdida: 'Presupuesto recortado',
      cerrado_en: '2026-04-05T12:00:00Z',
      created_at: '2026-03-25T09:00:00Z',
    },
  ];

  const { error } = await supabase.from('deals').upsert(deals);
  if (error) throw new Error(`Deals: ${error.message}`);
}
