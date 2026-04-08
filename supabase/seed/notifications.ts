import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserMap } from './users';
import { EMPRESA_IDS, DEAL_IDS } from './ids';
import { dayOffset } from './seed-date';

/**
 * Seed the `notificaciones` table so every test user sees a populated bell
 * on first login. Four rows per vendedor: a mix of `leido` true/false and
 * `tipo` values (overdue follow-up, stalled deal, task assigned, mention,
 * system), including at least one linkable type per user so click-through
 * works out of the box.
 *
 * The column is `leido` (not `leida`). `tipo` is free-form TEXT — the
 * notification engine uses `follow_up_overdue` and `deal_stalled` as the
 * two linkable types (see src/app/api/notificaciones/route.ts).
 */
export async function seedNotifications(supabase: SupabaseClient, users: UserMap) {
  console.log('  Creating notifications...');

  const notificaciones = [
    // ===== IGNACIO — 4 rows =====
    {
      id: '80000000-0000-4000-a000-000000000001',
      usuario_id: users.ignacio,
      titulo: 'Seguimiento vencido',
      contenido: 'VetPartners tiene una accion pendiente: revisar propuesta ajustada.',
      tipo: 'follow_up_overdue',
      referencia_id: EMPRESA_IDS.VETPARTNERS,
      leido: false,
      created_at: dayOffset(-1, 9),
    },
    {
      id: '80000000-0000-4000-a000-000000000002',
      usuario_id: users.ignacio,
      titulo: 'Deal estancado',
      contenido: 'VetPartners lleva 22 dias en "Negociacion" (fase de 7 dias).',
      tipo: 'deal_stalled',
      referencia_id: DEAL_IDS.VETPARTNERS,
      leido: false,
      created_at: dayOffset(-1, 10),
    },
    {
      id: '80000000-0000-4000-a000-000000000003',
      usuario_id: users.ignacio,
      titulo: 'Nueva tarea asignada',
      contenido: 'Rebeca te ha asignado "Preparar pitch reactivacion EcoPets".',
      tipo: 'task_assigned',
      referencia_id: null,
      leido: true,
      created_at: dayOffset(-2, 11),
    },
    {
      id: '80000000-0000-4000-a000-000000000004',
      usuario_id: users.ignacio,
      titulo: 'Deal ganado',
      contenido: 'Has cerrado PetCorner como ganado (90.000 EUR).',
      tipo: 'deal_won',
      referencia_id: DEAL_IDS.PETCORNER,
      leido: true,
      created_at: dayOffset(-6, 14),
    },

    // ===== LAURA — 4 rows =====
    {
      id: '80000000-0000-4000-a000-000000000005',
      usuario_id: users.laura,
      titulo: 'Seguimiento vencido',
      contenido: 'Clinica Sol tiene una accion pendiente: preparar demo del sistema de pedidos.',
      tipo: 'follow_up_overdue',
      referencia_id: EMPRESA_IDS.CLINICA_SOL,
      leido: false,
      created_at: dayOffset(-1, 8),
    },
    {
      id: '80000000-0000-4000-a000-000000000006',
      usuario_id: users.laura,
      titulo: 'Mencion en nota',
      contenido: 'Rebeca te ha mencionado en una nota de VetLab: "@laura revisar condiciones".',
      tipo: 'mention',
      referencia_id: EMPRESA_IDS.VETLAB,
      leido: false,
      created_at: dayOffset(-1, 15),
    },
    {
      id: '80000000-0000-4000-a000-000000000007',
      usuario_id: users.laura,
      titulo: 'Recordatorio de tarea',
      contenido: 'Tu tarea "Contactar AgroVet Levante" vence hoy.',
      tipo: 'task_reminder',
      referencia_id: null,
      leido: false,
      created_at: dayOffset(0, 7),
    },
    {
      id: '80000000-0000-4000-a000-000000000008',
      usuario_id: users.laura,
      titulo: 'Sistema',
      contenido: 'Bienvenida a Autopilot CRM. Revisa tu cockpit para empezar.',
      tipo: 'system',
      referencia_id: null,
      leido: true,
      created_at: dayOffset(-14, 9),
    },

    // ===== REBECA (direccion) — 4 rows =====
    {
      id: '80000000-0000-4000-a000-000000000009',
      usuario_id: users.rebeca,
      titulo: 'KPI en rojo',
      contenido: 'El equipo comercial esta por debajo del objetivo mensual de deals ganados.',
      tipo: 'kpi_red',
      referencia_id: null,
      leido: false,
      created_at: dayOffset(-1, 9),
    },
    {
      id: '80000000-0000-4000-a000-00000000000a',
      usuario_id: users.rebeca,
      titulo: 'Deal estancado en equipo',
      contenido: 'VetPartners (Ignacio) lleva 22 dias en Negociacion. Considera intervenir.',
      tipo: 'deal_stalled',
      referencia_id: DEAL_IDS.VETPARTNERS,
      leido: false,
      created_at: dayOffset(-2, 10),
    },
    {
      id: '80000000-0000-4000-a000-00000000000b',
      usuario_id: users.rebeca,
      titulo: 'Nuevo lead asignado',
      contenido: 'Has asignado PetShop Madrid a Ignacio.',
      tipo: 'lead_assigned',
      referencia_id: EMPRESA_IDS.PETSHOP_MADRID,
      leido: true,
      created_at: dayOffset(-12, 10),
    },
    {
      id: '80000000-0000-4000-a000-00000000000c',
      usuario_id: users.rebeca,
      titulo: 'Resumen semanal disponible',
      contenido: 'El resumen de la semana esta listo. Revisa la evolucion de KPIs del equipo.',
      tipo: 'system',
      referencia_id: null,
      leido: true,
      created_at: dayOffset(-3, 8),
    },
  ];

  const { error } = await supabase.from('notificaciones').upsert(notificaciones, { onConflict: 'id' });
  if (error) throw new Error(`Notifications: ${error.message}`);
}
