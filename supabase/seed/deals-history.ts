import type { UserMap } from './users';
import { PIPELINE_ID, FASE_IDS, EMPRESA_IDS } from './ids';
import { dayOffset } from './seed-date';

/**
 * Synthetic historical deals that give the dashboard MTD-vs-prev-MTD deltas
 * real signal. These use inline UUIDs (not in `ids.ts`) because they only
 * exist to populate the historical queries and are never referenced by name
 * from the app.
 *
 * IMPORTANT — RLS constraint: each deal's `vendedor_asignado` MUST match
 * its parent empresa's `vendedor_asignado`. The `empresas` SELECT policy
 * gates on `vendedor_asignado = auth.uid()` independently from the `deals`
 * policy, so a mismatch makes the deal visible to a vendedor while the
 * PostgREST inner-join to empresas returns null — crashing any component
 * that assumes `deal.empresa` is non-null. Team-KPI mix is still achieved
 * below by picking empresas owned by both Ignacio and Laura (3 each).
 */
export function buildHistoryDeals(users: UserMap) {
  return [
    // ----- Previous month-to-date — wins (anchored ~34 days back) -----
    {
      // PETSHOP_MADRID → ignacio (matches empresa owner)
      id: '00000000-0000-0000-0000-0000000000a1',
      empresa_id: EMPRESA_IDS.PETSHOP_MADRID,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 40000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: dayOffset(-34, 10),
      resultado: 'ganado',
      cerrado_en: dayOffset(-34, 10),
      created_at: dayOffset(-50, 10),
    },
    {
      // VETPARTNERS → ignacio (matches empresa owner)
      id: '00000000-0000-0000-0000-0000000000a2',
      empresa_id: EMPRESA_IDS.VETPARTNERS,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 55000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: dayOffset(-32, 11),
      resultado: 'ganado',
      cerrado_en: dayOffset(-32, 11),
      created_at: dayOffset(-47, 10),
    },
    // ----- Previous month-to-date — loss -----
    {
      // AGROVET → laura (matches empresa owner)
      id: '00000000-0000-0000-0000-0000000000a3',
      empresa_id: EMPRESA_IDS.AGROVET,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.PROPUESTA,
      valor: 18000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: dayOffset(-40, 9),
      resultado: 'perdido',
      motivo_perdida: 'Eligió competidor',
      cerrado_en: dayOffset(-33, 15),
      created_at: dayOffset(-45, 9),
    },
    // ----- Current month-to-date — wins so current month has signal -----
    {
      // PETFOOD_EXPRESS → laura (matches empresa owner)
      id: '00000000-0000-0000-0000-0000000000b1',
      empresa_id: EMPRESA_IDS.PETFOOD_EXPRESS,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 48000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: dayOffset(-4, 11),
      resultado: 'ganado',
      cerrado_en: dayOffset(-4, 11),
      created_at: dayOffset(-19, 10),
    },
    {
      // ANIMALIA → ignacio (matches empresa owner)
      id: '00000000-0000-0000-0000-0000000000b2',
      empresa_id: EMPRESA_IDS.ANIMALIA,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.POSTVENTA,
      valor: 72000,
      vendedor_asignado: users.ignacio,
      fecha_entrada_fase: dayOffset(-2, 16),
      resultado: 'ganado',
      cerrado_en: dayOffset(-2, 16),
      created_at: dayOffset(-15, 10),
    },
    // ----- Current month-to-date — loss -----
    {
      // ZOORETAIL → laura (matches empresa owner)
      id: '00000000-0000-0000-0000-0000000000b3',
      empresa_id: EMPRESA_IDS.ZOORETAIL,
      pipeline_id: PIPELINE_ID,
      fase_actual: FASE_IDS.PROPUESTA,
      valor: 22000,
      vendedor_asignado: users.laura,
      fecha_entrada_fase: dayOffset(-9, 10),
      resultado: 'perdido',
      motivo_perdida: 'Presupuesto recortado',
      cerrado_en: dayOffset(-1, 12),
      created_at: dayOffset(-12, 9),
    },
  ];
}
