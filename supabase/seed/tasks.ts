import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserMap } from './users';
import { EMPRESA_IDS, DEAL_IDS } from './ids';
import { dateOffset } from './seed-date';

/**
 * Tareas seed — 18 rows with a deterministic distribution per vendedor.
 *
 * Purpose: ensure the two task KPIs (`tareas_pendientes` = all incomplete,
 * `tareas_vencidas` = incomplete AND past due) are BOTH non-zero and clearly
 * different for every test user, so the cockpit never looks empty or
 * ambiguous on seed day.
 *
 * Distribution per vendedor (relative to SEED_TODAY):
 *   ignacio → 2 overdue + 1 today + 1 tomorrow + 2 future + 2 completed      = 8
 *   laura   → 1 overdue + 1 today + 1 tomorrow + 2 future + 2 completed + 1 no-date = 8
 *   rebeca  → 1 future + 1 completed                                           = 2
 *
 * Expected KPI payload for Ignacio on seed day:
 *   tareas_pendientes = 6 (2 overdue + 1 today + 1 tomorrow + 2 future)
 *   tareas_vencidas   = 2 (only the two rows with past fecha_vencimiento)
 *
 * IDs use the 70xxx namespace (inline) because tareas are never referenced
 * by name from app code — they only exist for seed determinism.
 */
export async function seedTasks(supabase: SupabaseClient, users: UserMap) {
  console.log('  Creating tasks...');

  const tareas = [
    // ===== IGNACIO — 8 tareas =====
    // Overdue #1 — VetPartners stuck in negociacion
    {
      id: '70000000-0000-4000-a000-000000000001',
      empresa_id: EMPRESA_IDS.VETPARTNERS,
      deal_id: DEAL_IDS.VETPARTNERS,
      vendedor_asignado: users.ignacio,
      titulo: 'Enviar propuesta revisada VetPartners',
      descripcion: 'Dr. Torres pidio ajustes en precios por volumen. Llamar urgente para desbloquear.',
      prioridad: 'alta',
      fecha_vencimiento: dateOffset(-3),
      completada: false,
      origen: 'manual',
      tipo_tarea: 'email',
    },
    // Overdue #2 — Animalia contacto inicial
    {
      id: '70000000-0000-4000-a000-000000000002',
      empresa_id: EMPRESA_IDS.ANIMALIA,
      deal_id: DEAL_IDS.ANIMALIA,
      vendedor_asignado: users.ignacio,
      titulo: 'Enviar material Animalia Store',
      descripcion: 'Preparar dossier con casos de exito y ficha de producto premium.',
      prioridad: 'alta',
      fecha_vencimiento: dateOffset(-1),
      completada: false,
      origen: 'manual',
      tipo_tarea: 'email',
    },
    // Today — PetShop Madrid nuevo lead
    {
      id: '70000000-0000-4000-a000-000000000003',
      empresa_id: EMPRESA_IDS.PETSHOP_MADRID,
      deal_id: DEAL_IDS.PETSHOP,
      vendedor_asignado: users.ignacio,
      titulo: 'Llamar a PetShop Madrid',
      descripcion: 'Primera llamada de calificacion. Usar script de apertura en frio.',
      prioridad: 'alta',
      fecha_vencimiento: dateOffset(0),
      completada: false,
      origen: 'manual',
      tipo_tarea: 'llamada',
    },
    // Tomorrow — Animalia follow-up
    {
      id: '70000000-0000-4000-a000-000000000004',
      empresa_id: EMPRESA_IDS.ANIMALIA,
      deal_id: DEAL_IDS.ANIMALIA,
      vendedor_asignado: users.ignacio,
      titulo: 'Reunion online Animalia',
      descripcion: 'Videollamada de 30 minutos con Elena Moreno para presentacion.',
      prioridad: 'media',
      fecha_vencimiento: dateOffset(1),
      completada: false,
      origen: 'sistema',
      tipo_tarea: 'reunion',
    },
    // Future +3 — EcoPets reactivation pitch
    {
      id: '70000000-0000-4000-a000-000000000005',
      empresa_id: EMPRESA_IDS.ECOPETS,
      deal_id: DEAL_IDS.ECOPETS,
      vendedor_asignado: users.ignacio,
      titulo: 'Preparar pitch reactivacion EcoPets',
      descripcion: 'Cliente historico que cancelo. Preparar oferta de retorno con descuento.',
      prioridad: 'media',
      fecha_vencimiento: dateOffset(3),
      completada: false,
      origen: 'manual',
      tipo_tarea: 'seguimiento',
    },
    // Future +7 — PetCorner quarterly review
    {
      id: '70000000-0000-4000-a000-000000000006',
      empresa_id: EMPRESA_IDS.PETCORNER,
      deal_id: DEAL_IDS.PETCORNER,
      vendedor_asignado: users.ignacio,
      titulo: 'Revision trimestral PetCorner',
      descripcion: 'Revisar consumo del trimestre y proponer ampliacion de gama.',
      prioridad: 'media',
      fecha_vencimiento: dateOffset(7),
      completada: false,
      origen: 'sistema',
      tipo_tarea: 'reunion',
    },
    // Completed #1 — Mascotas Felices order confirmation
    {
      id: '70000000-0000-4000-a000-000000000007',
      empresa_id: EMPRESA_IDS.MASCOTAS_FELICES,
      deal_id: DEAL_IDS.MASCOTAS,
      vendedor_asignado: users.ignacio,
      titulo: 'Confirmacion pedido Mascotas Felices',
      descripcion: 'Confirmar entrega del primer pedido tras onboarding.',
      prioridad: 'alta',
      fecha_vencimiento: dateOffset(-5),
      completada: true,
      origen: 'manual',
      tipo_tarea: 'llamada',
    },
    // Completed #2 — PetCorner fichas tecnicas
    {
      id: '70000000-0000-4000-a000-000000000008',
      empresa_id: EMPRESA_IDS.PETCORNER,
      deal_id: DEAL_IDS.PETCORNER,
      vendedor_asignado: users.ignacio,
      titulo: 'Envio fichas tecnicas PetCorner',
      descripcion: 'Enviar fichas actualizadas de gama premium solicitadas.',
      prioridad: 'media',
      fecha_vencimiento: dateOffset(-10),
      completada: true,
      origen: 'manual',
      tipo_tarea: 'email',
    },

    // ===== LAURA — 8 tareas =====
    // Overdue — Clinica Sol demo
    {
      id: '70000000-0000-4000-a000-000000000009',
      empresa_id: EMPRESA_IDS.CLINICA_SOL,
      deal_id: DEAL_IDS.CLINICA,
      vendedor_asignado: users.laura,
      titulo: 'Preparar demo Clinica Sol',
      descripcion: 'Dra. Moreno quiere ver demo del sistema de pedidos online.',
      prioridad: 'alta',
      fecha_vencimiento: dateOffset(-2),
      completada: false,
      origen: 'manual',
      tipo_tarea: 'reunion',
    },
    // Today — AgroVet
    {
      id: '70000000-0000-4000-a000-00000000000a',
      empresa_id: EMPRESA_IDS.AGROVET,
      deal_id: DEAL_IDS.AGROVET,
      vendedor_asignado: users.laura,
      titulo: 'Contactar AgroVet Levante',
      descripcion: 'Llamar a Pedro Sanchez para agendar visita comercial.',
      prioridad: 'alta',
      fecha_vencimiento: dateOffset(0),
      completada: false,
      origen: 'manual',
      tipo_tarea: 'llamada',
    },
    // Tomorrow — PetFood Express
    {
      id: '70000000-0000-4000-a000-00000000000b',
      empresa_id: EMPRESA_IDS.PETFOOD_EXPRESS,
      deal_id: DEAL_IDS.PETFOOD,
      vendedor_asignado: users.laura,
      titulo: 'Envio catalogo PetFood Express',
      descripcion: 'Enviar catalogo completo con condiciones especiales para distribuidores.',
      prioridad: 'media',
      fecha_vencimiento: dateOffset(1),
      completada: false,
      origen: 'manual',
      tipo_tarea: 'email',
    },
    // Future +4 — VetSalud
    {
      id: '70000000-0000-4000-a000-00000000000c',
      empresa_id: EMPRESA_IDS.VETSALUD,
      deal_id: DEAL_IDS.VETSALUD,
      vendedor_asignado: users.laura,
      titulo: 'Primera llamada VetSalud',
      descripcion: 'Llamada de calificacion con Roberto Garcia. Usar script en frio.',
      prioridad: 'media',
      fecha_vencimiento: dateOffset(4),
      completada: false,
      origen: 'sistema',
      tipo_tarea: 'llamada',
    },
    // Future +10 — Mascotas Sur
    {
      id: '70000000-0000-4000-a000-00000000000d',
      empresa_id: EMPRESA_IDS.MASCOTAS_SUR,
      deal_id: DEAL_IDS.MASCOTAS_SUR,
      vendedor_asignado: users.laura,
      titulo: 'Seguimiento Mascotas Sur',
      descripcion: 'Revisar interes tras envio de propuesta inicial.',
      prioridad: 'baja',
      fecha_vencimiento: dateOffset(10),
      completada: false,
      origen: 'sistema',
      tipo_tarea: 'seguimiento',
    },
    // Completed #1 — VetLab contract signing
    {
      id: '70000000-0000-4000-a000-00000000000e',
      empresa_id: EMPRESA_IDS.VETLAB,
      deal_id: DEAL_IDS.VETLAB_WON,
      vendedor_asignado: users.laura,
      titulo: 'Firma contrato VetLab',
      descripcion: 'Reunion de firma con direccion de VetLab para cerrar primera compra.',
      prioridad: 'alta',
      fecha_vencimiento: dateOffset(-48),
      completada: true,
      origen: 'manual',
      tipo_tarea: 'reunion',
    },
    // Completed #2 — ZooRetail prospection call
    {
      id: '70000000-0000-4000-a000-00000000000f',
      empresa_id: EMPRESA_IDS.ZOORETAIL,
      deal_id: DEAL_IDS.ZOORETAIL,
      vendedor_asignado: users.laura,
      titulo: 'Llamada prospeccion ZooRetail',
      descripcion: 'Primera toma de contacto con responsable de compras.',
      prioridad: 'media',
      fecha_vencimiento: dateOffset(-6),
      completada: true,
      origen: 'manual',
      tipo_tarea: 'llamada',
    },
    // No date — general admin task (exercises the "sin fecha" bucket)
    {
      id: '70000000-0000-4000-a000-000000000010',
      vendedor_asignado: users.laura,
      titulo: 'Revision de leads nuevos de la semana',
      descripcion: 'Triaje y calificacion de los leads que entraron por la web.',
      prioridad: 'baja',
      fecha_vencimiento: null,
      completada: false,
      origen: 'sistema',
      tipo_tarea: 'admin',
    },

    // ===== REBECA — 2 tareas (manager, not front-line) =====
    // Future +5 — weekly team review
    {
      id: '70000000-0000-4000-a000-000000000011',
      vendedor_asignado: users.rebeca,
      titulo: 'Revision semanal del equipo comercial',
      descripcion: 'Repaso de pipeline, bloqueos y prioridades con Ignacio y Laura.',
      prioridad: 'media',
      fecha_vencimiento: dateOffset(5),
      completada: false,
      origen: 'sistema',
      tipo_tarea: 'reunion',
    },
    // Completed — quarterly audit
    {
      id: '70000000-0000-4000-a000-000000000012',
      vendedor_asignado: users.rebeca,
      titulo: 'Auditoria pipeline Q1',
      descripcion: 'Revision de deals cerrados y analisis de motivos de perdida.',
      prioridad: 'media',
      fecha_vencimiento: dateOffset(-20),
      completada: true,
      origen: 'manual',
      tipo_tarea: 'reunion',
    },
  ];

  const { error } = await supabase.from('tareas').upsert(tareas, { onConflict: 'id' });
  if (error) throw new Error(`Tasks: ${error.message}`);
}
