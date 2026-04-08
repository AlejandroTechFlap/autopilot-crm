import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserMap } from './users';
import { EMPRESA_IDS, CONTACTO_IDS, DEAL_IDS } from './ids';
import { dayOffset } from './seed-date';

export async function seedActivities(supabase: SupabaseClient, users: UserMap) {
  console.log('  Creating activities...');

  const actividades = [
    // --- PetShop Madrid (2) ---
    { empresa_id: EMPRESA_IDS.PETSHOP_MADRID, tipo: 'sistema', contenido: 'Lead creado desde campana de Google Ads', usuario_id: users.admin, created_at: dayOffset(-12, 10) },
    { empresa_id: EMPRESA_IDS.PETSHOP_MADRID, contacto_id: CONTACTO_IDS.CARLOS_RUIZ, deal_id: DEAL_IDS.PETSHOP, tipo: 'llamada', contenido: 'Primer contacto con Carlos Ruiz. Interesado en linea premium de alimentacion para mascotas.', usuario_id: users.ignacio, created_at: dayOffset(0, 9) },

    // --- VetPartners Barcelona (4) ---
    { empresa_id: EMPRESA_IDS.VETPARTNERS, tipo: 'sistema', contenido: 'Lead creado por referido de Dr. Martinez', usuario_id: users.admin, created_at: dayOffset(-27, 9) },
    { empresa_id: EMPRESA_IDS.VETPARTNERS, contacto_id: CONTACTO_IDS.JAVIER_TORRES, deal_id: DEAL_IDS.VETPARTNERS, tipo: 'llamada', contenido: 'Contacto inicial con Dr. Torres. Cadena de 3 clinicas veterinarias en Barcelona.', usuario_id: users.ignacio, created_at: dayOffset(-26, 10) },
    { empresa_id: EMPRESA_IDS.VETPARTNERS, deal_id: DEAL_IDS.VETPARTNERS, tipo: 'cambio_fase', contenido: 'Deal avanzo a Contacto Inicial', usuario_id: users.ignacio, created_at: dayOffset(-25, 14) },
    { empresa_id: EMPRESA_IDS.VETPARTNERS, contacto_id: CONTACTO_IDS.JAVIER_TORRES, deal_id: DEAL_IDS.VETPARTNERS, tipo: 'reunion', contenido: 'Reunion presencial en Barcelona. Presentacion de catalogo completo de productos.', usuario_id: users.ignacio, created_at: dayOffset(-23, 16) },

    // --- AgroVet Levante (3) ---
    { empresa_id: EMPRESA_IDS.AGROVET, tipo: 'sistema', contenido: 'Lead captado en feria AgroExpo 2026', usuario_id: users.admin, created_at: dayOffset(-17, 11) },
    { empresa_id: EMPRESA_IDS.AGROVET, contacto_id: CONTACTO_IDS.ANA_MARTIN, deal_id: DEAL_IDS.AGROVET, tipo: 'llamada', contenido: 'Primera llamada con Ana Martin. Interesada en suministros veterinarios para zona Levante.', usuario_id: users.laura, created_at: dayOffset(-12, 10) },
    { empresa_id: EMPRESA_IDS.AGROVET, deal_id: DEAL_IDS.AGROVET, tipo: 'cambio_fase', contenido: 'Deal avanzo a Contacto Inicial', usuario_id: users.laura, created_at: dayOffset(-9, 15) },

    // --- Mascotas Felices (4) ---
    { empresa_id: EMPRESA_IDS.MASCOTAS_FELICES, tipo: 'sistema', contenido: 'Lead organico desde formulario web', usuario_id: users.admin, created_at: dayOffset(-32, 10) },
    { empresa_id: EMPRESA_IDS.MASCOTAS_FELICES, contacto_id: CONTACTO_IDS.LUCIA_FERNANDEZ, deal_id: DEAL_IDS.MASCOTAS, tipo: 'llamada', contenido: 'Contacto con Lucia Fernandez. Tiene 2 tiendas en Madrid centro.', usuario_id: users.ignacio, created_at: dayOffset(-31, 11) },
    { empresa_id: EMPRESA_IDS.MASCOTAS_FELICES, deal_id: DEAL_IDS.MASCOTAS, tipo: 'cambio_fase', contenido: 'Deal avanzo rapidamente: Propuesta → Negociacion → Cierre', usuario_id: users.ignacio, created_at: dayOffset(-19, 14) },
    { empresa_id: EMPRESA_IDS.MASCOTAS_FELICES, deal_id: DEAL_IDS.MASCOTAS, tipo: 'nota', contenido: 'Deal cerrado como GANADO. Contrato firmado por 60.000 EUR. Cliente muy satisfecha.', usuario_id: users.ignacio, created_at: dayOffset(-12, 16) },

    // --- PetFood Express (2) ---
    { empresa_id: EMPRESA_IDS.PETFOOD_EXPRESS, tipo: 'sistema', contenido: 'Lead de cold call', usuario_id: users.admin, created_at: dayOffset(-3, 14) },
    { empresa_id: EMPRESA_IDS.PETFOOD_EXPRESS, contacto_id: CONTACTO_IDS.ROBERTO_GARCIA, deal_id: DEAL_IDS.PETFOOD, tipo: 'llamada', contenido: 'Llamada en frio a Roberto Garcia. Interesado pero pide mas informacion por email.', usuario_id: users.laura, created_at: dayOffset(-2, 10) },

    // --- Clinica Sol (3) ---
    { empresa_id: EMPRESA_IDS.CLINICA_SOL, tipo: 'sistema', contenido: 'Lead referido por Dr. Torres (VetPartners Barcelona)', usuario_id: users.admin, created_at: dayOffset(-22, 9) },
    { empresa_id: EMPRESA_IDS.CLINICA_SOL, contacto_id: CONTACTO_IDS.ELENA_MORENO, deal_id: DEAL_IDS.CLINICA, tipo: 'llamada', contenido: 'Contacto con Dra. Elena Moreno. Clinica grande con 15 empleados. Necesitan suministros.', usuario_id: users.laura, created_at: dayOffset(-20, 11) },
    { empresa_id: EMPRESA_IDS.CLINICA_SOL, deal_id: DEAL_IDS.CLINICA, tipo: 'cambio_fase', contenido: 'Deal avanzo a Propuesta Enviada. Propuesta enviada por email.', usuario_id: users.laura, created_at: dayOffset(-7, 14) },

    // --- Animalia Store (2) ---
    { empresa_id: EMPRESA_IDS.ANIMALIA, tipo: 'sistema', contenido: 'Lead importado de base de datos externa', usuario_id: users.admin, created_at: dayOffset(-15, 10) },
    { empresa_id: EMPRESA_IDS.ANIMALIA, contacto_id: CONTACTO_IDS.PATRICIA_JIMENEZ, deal_id: DEAL_IDS.ANIMALIA, tipo: 'llamada', contenido: 'Primera llamada con Patricia. Tienda mediana en Valencia, busca proveedor de alimentacion.', usuario_id: users.ignacio, created_at: dayOffset(-9, 15) },

    // --- VetSalud Plus (2) ---
    { empresa_id: EMPRESA_IDS.VETSALUD, tipo: 'sistema', contenido: 'Lead captado desde campana de Google Ads', usuario_id: users.admin, created_at: dayOffset(-5, 8) },
    { empresa_id: EMPRESA_IDS.VETSALUD, tipo: 'nota', contenido: 'Web visitada varias veces. Pendiente de primera llamada de contacto.', usuario_id: users.laura, created_at: dayOffset(-4, 9) },

    // --- PetCorner Bilbao (4) ---
    { empresa_id: EMPRESA_IDS.PETCORNER, tipo: 'sistema', contenido: 'Lead referido por partner comercial', usuario_id: users.admin, created_at: dayOffset(-45, 10) },
    { empresa_id: EMPRESA_IDS.PETCORNER, contacto_id: CONTACTO_IDS.ISABEL_HERRERO, deal_id: DEAL_IDS.PETCORNER, tipo: 'llamada', contenido: 'Contacto con Isabel Herrero (CEO). Muy interesada en linea premium.', usuario_id: users.ignacio, created_at: dayOffset(-43, 11) },
    { empresa_id: EMPRESA_IDS.PETCORNER, contacto_id: CONTACTO_IDS.ISABEL_HERRERO, deal_id: DEAL_IDS.PETCORNER, tipo: 'reunion', contenido: 'Reunion de cierre en Bilbao. Acuerdo alcanzado.', usuario_id: users.ignacio, created_at: dayOffset(-29, 16) },
    { empresa_id: EMPRESA_IDS.PETCORNER, deal_id: DEAL_IDS.PETCORNER, tipo: 'nota', contenido: 'Deal cerrado como GANADO. Contrato firmado por 90.000 EUR.', usuario_id: users.ignacio, created_at: dayOffset(-27, 10) },

    // --- ZooRetail Sevilla (1) ---
    { empresa_id: EMPRESA_IDS.ZOORETAIL, tipo: 'sistema', contenido: 'Lead organico desde buscador', usuario_id: users.admin, created_at: dayOffset(-2, 12) },

    // --- Nutrivet Galicia (3) ---
    { empresa_id: EMPRESA_IDS.NUTRIVET, tipo: 'sistema', contenido: 'Lead de cold call', usuario_id: users.admin, created_at: dayOffset(-36, 9) },
    { empresa_id: EMPRESA_IDS.NUTRIVET, contacto_id: CONTACTO_IDS.ROSA_VAZQUEZ, deal_id: DEAL_IDS.NUTRIVET, tipo: 'llamada', contenido: 'Contacto frio con Rosa Vazquez. Empresa pequena de suplementos veterinarios.', usuario_id: users.ignacio, created_at: dayOffset(-32, 10) },
    { empresa_id: EMPRESA_IDS.NUTRIVET, deal_id: DEAL_IDS.NUTRIVET, tipo: 'nota', contenido: 'Deal PERDIDO. No tienen presupuesto disponible para este trimestre.', usuario_id: users.ignacio, created_at: dayOffset(-17, 15) },

    // ===== Phase "Mock Data Overhaul" — coverage additions =====
    // --- EcoPets Sostenible (7) — historical won + reactivation ---
    { empresa_id: EMPRESA_IDS.ECOPETS, tipo: 'sistema', contenido: 'Lead historico migrado desde sistema anterior', usuario_id: users.admin, created_at: dayOffset(-90, 11) },
    { empresa_id: EMPRESA_IDS.ECOPETS, contacto_id: CONTACTO_IDS.SERGIO_NAVARRO, deal_id: DEAL_IDS.ECOPETS_PAST, tipo: 'llamada', contenido: 'Primer contacto con Sergio Navarro. Enfoque en productos sostenibles y ecologicos.', usuario_id: users.ignacio, created_at: dayOffset(-88, 10) },
    { empresa_id: EMPRESA_IDS.ECOPETS, deal_id: DEAL_IDS.ECOPETS_PAST, tipo: 'cambio_fase', contenido: 'Deal avanzo rapidamente a Cierre', usuario_id: users.ignacio, created_at: dayOffset(-80, 14) },
    { empresa_id: EMPRESA_IDS.ECOPETS, deal_id: DEAL_IDS.ECOPETS_PAST, tipo: 'nota', contenido: 'Deal cerrado GANADO por 52.000 EUR. Primera linea de productos eco.', usuario_id: users.ignacio, created_at: dayOffset(-75, 14) },
    { empresa_id: EMPRESA_IDS.ECOPETS, tipo: 'nota', contenido: 'Cliente cancelo contrato por cambio a proveedor local. Oportunidad reactivable.', usuario_id: users.ignacio, created_at: dayOffset(-40, 15) },
    { empresa_id: EMPRESA_IDS.ECOPETS, tipo: 'sistema', contenido: 'Nueva oportunidad de reactivacion creada', usuario_id: users.admin, created_at: dayOffset(0, 11) },
    { empresa_id: EMPRESA_IDS.ECOPETS, contacto_id: CONTACTO_IDS.SERGIO_NAVARRO, deal_id: DEAL_IDS.ECOPETS, tipo: 'llamada', contenido: 'Llamada de reactivacion. Sergio abierto a escuchar nueva propuesta mejorada.', usuario_id: users.ignacio, created_at: dayOffset(0, 12) },

    // --- VetNorte Asturias (4) ---
    { empresa_id: EMPRESA_IDS.VETNORTE, tipo: 'sistema', contenido: 'Lead captado en feria de ganaderia y veterinaria rural', usuario_id: users.admin, created_at: dayOffset(-10, 10) },
    { empresa_id: EMPRESA_IDS.VETNORTE, contacto_id: CONTACTO_IDS.DAVID_RUBIO, deal_id: DEAL_IDS.VETNORTE, tipo: 'llamada', contenido: 'Contacto con David Rubio. Asociacion de veterinarios rurales en Asturias.', usuario_id: users.laura, created_at: dayOffset(-8, 11) },
    { empresa_id: EMPRESA_IDS.VETNORTE, deal_id: DEAL_IDS.VETNORTE, tipo: 'cambio_fase', contenido: 'Deal avanzo a Contacto Inicial', usuario_id: users.laura, created_at: dayOffset(-3, 9) },
    { empresa_id: EMPRESA_IDS.VETNORTE, tipo: 'nota', contenido: 'Piden muestras de producto especificas para ganado bovino y ovino.', usuario_id: users.laura, created_at: dayOffset(-2, 16) },

    // --- Mascotas del Sur (3) ---
    { empresa_id: EMPRESA_IDS.MASCOTAS_SUR, tipo: 'sistema', contenido: 'Lead importado desde base de datos externa de aperturas recientes', usuario_id: users.admin, created_at: dayOffset(-7, 9) },
    { empresa_id: EMPRESA_IDS.MASCOTAS_SUR, contacto_id: CONTACTO_IDS.OSCAR_PRIETO, deal_id: DEAL_IDS.MASCOTAS_SUR, tipo: 'llamada', contenido: 'Primer contacto con Oscar Prieto. Nueva tienda abierta hace 2 meses en Malaga.', usuario_id: users.laura, created_at: dayOffset(-5, 10) },
    { empresa_id: EMPRESA_IDS.MASCOTAS_SUR, tipo: 'nota', contenido: 'Interesado en productos de iniciacion y catalogo basico para nueva tienda.', usuario_id: users.laura, created_at: dayOffset(-1, 15) },

    // --- PetBoutique Luxury (5) ---
    { empresa_id: EMPRESA_IDS.PETBOUTIQUE, tipo: 'sistema', contenido: 'Lead organico desde formulario web premium', usuario_id: users.admin, created_at: dayOffset(-60, 10) },
    { empresa_id: EMPRESA_IDS.PETBOUTIQUE, contacto_id: CONTACTO_IDS.NURIA_CASTRO, deal_id: DEAL_IDS.PETBOUTIQUE, tipo: 'llamada', contenido: 'Contacto con Nuria Castro (CEO). Boutique de lujo con peluqueria y spa canino.', usuario_id: users.ignacio, created_at: dayOffset(-58, 11) },
    { empresa_id: EMPRESA_IDS.PETBOUTIQUE, contacto_id: CONTACTO_IDS.NURIA_CASTRO, deal_id: DEAL_IDS.PETBOUTIQUE, tipo: 'reunion', contenido: 'Reunion de presentacion en Madrid. Productos premium confirmados para catalogo.', usuario_id: users.ignacio, created_at: dayOffset(-40, 16) },
    { empresa_id: EMPRESA_IDS.PETBOUTIQUE, deal_id: DEAL_IDS.PETBOUTIQUE, tipo: 'cambio_fase', contenido: 'Deal avanzo a Negociacion', usuario_id: users.ignacio, created_at: dayOffset(-10, 14) },
    { empresa_id: EMPRESA_IDS.PETBOUTIQUE, deal_id: DEAL_IDS.PETBOUTIQUE, tipo: 'cambio_fase', contenido: 'Deal avanzo a Cierre. Firma prevista esta semana.', usuario_id: users.ignacio, created_at: dayOffset(-2, 10) },

    // --- VetLab Diagnostico (9) — won + lost ---
    { empresa_id: EMPRESA_IDS.VETLAB, tipo: 'sistema', contenido: 'Lead referido por Dra. Moreno (Clinica Sol)', usuario_id: users.admin, created_at: dayOffset(-80, 10) },
    { empresa_id: EMPRESA_IDS.VETLAB, contacto_id: CONTACTO_IDS.TERESA_MOLINA, deal_id: DEAL_IDS.VETLAB_WON, tipo: 'llamada', contenido: 'Primer contacto con Dra. Teresa Molina. Laboratorio de diagnostico veterinario.', usuario_id: users.laura, created_at: dayOffset(-78, 11) },
    { empresa_id: EMPRESA_IDS.VETLAB, contacto_id: CONTACTO_IDS.TERESA_MOLINA, deal_id: DEAL_IDS.VETLAB_WON, tipo: 'reunion', contenido: 'Reunion presencial en Valencia. Presentacion de catalogo de reactivos.', usuario_id: users.laura, created_at: dayOffset(-70, 15) },
    { empresa_id: EMPRESA_IDS.VETLAB, deal_id: DEAL_IDS.VETLAB_WON, tipo: 'cambio_fase', contenido: 'Deal VETLAB_WON avanzo a Cierre', usuario_id: users.laura, created_at: dayOffset(-55, 14) },
    { empresa_id: EMPRESA_IDS.VETLAB, deal_id: DEAL_IDS.VETLAB_WON, tipo: 'nota', contenido: 'Deal cerrado GANADO por 42.000 EUR. Primera compra de reactivos.', usuario_id: users.laura, created_at: dayOffset(-50, 11) },
    { empresa_id: EMPRESA_IDS.VETLAB, tipo: 'sistema', contenido: 'Segunda oportunidad creada tras primera compra exitosa', usuario_id: users.admin, created_at: dayOffset(-45, 10) },
    { empresa_id: EMPRESA_IDS.VETLAB, contacto_id: CONTACTO_IDS.RAMON_BLANCO, deal_id: DEAL_IDS.VETLAB_LOST, tipo: 'llamada', contenido: 'Presentacion de segunda propuesta a Ramon Blanco (Director Financiero).', usuario_id: users.laura, created_at: dayOffset(-42, 11) },
    { empresa_id: EMPRESA_IDS.VETLAB, deal_id: DEAL_IDS.VETLAB_LOST, tipo: 'cambio_fase', contenido: 'Segunda oportunidad avanzo a Propuesta', usuario_id: users.laura, created_at: dayOffset(-30, 10) },
    { empresa_id: EMPRESA_IDS.VETLAB, deal_id: DEAL_IDS.VETLAB_LOST, tipo: 'nota', contenido: 'Deal PERDIDO. Precio de segunda compra fuera de presupuesto trimestral.', usuario_id: users.laura, created_at: dayOffset(-25, 15) },

    // --- Recent activity on existing deals (last week — "recent activity feel") ---
    { empresa_id: EMPRESA_IDS.PETSHOP_MADRID, contacto_id: CONTACTO_IDS.CARLOS_RUIZ, deal_id: DEAL_IDS.PETSHOP, tipo: 'llamada', contenido: 'Seguimiento: Carlos confirma interes en el catalogo premium. Pidio una visita.', usuario_id: users.ignacio, created_at: dayOffset(-1, 11) },
    { empresa_id: EMPRESA_IDS.VETPARTNERS, deal_id: DEAL_IDS.VETPARTNERS, tipo: 'nota', contenido: 'Propuesta revisada enviada. Pendiente de respuesta de Dr. Torres.', usuario_id: users.ignacio, created_at: dayOffset(-5, 10) },
    { empresa_id: EMPRESA_IDS.VETPARTNERS, contacto_id: CONTACTO_IDS.JAVIER_TORRES, deal_id: DEAL_IDS.VETPARTNERS, tipo: 'llamada', contenido: 'Dr. Torres pide una ultima revision de terminos antes del cierre.', usuario_id: users.ignacio, created_at: dayOffset(-2, 15) },
    { empresa_id: EMPRESA_IDS.CLINICA_SOL, contacto_id: CONTACTO_IDS.ELENA_MORENO, deal_id: DEAL_IDS.CLINICA, tipo: 'llamada', contenido: 'Dra. Moreno confirma recepcion de propuesta. Revision esta semana.', usuario_id: users.laura, created_at: dayOffset(-1, 14) },
    { empresa_id: EMPRESA_IDS.ANIMALIA, contacto_id: CONTACTO_IDS.PATRICIA_JIMENEZ, deal_id: DEAL_IDS.ANIMALIA, tipo: 'reunion', contenido: 'Reunion online con Patricia. Interes confirmado, pendiente de envio de propuesta.', usuario_id: users.ignacio, created_at: dayOffset(-3, 16) },
    { empresa_id: EMPRESA_IDS.AGROVET, contacto_id: CONTACTO_IDS.ANA_MARTIN, deal_id: DEAL_IDS.AGROVET, tipo: 'llamada', contenido: 'Seguimiento con Ana Martin. Pide mas informacion sobre suministros para Levante.', usuario_id: users.laura, created_at: dayOffset(-4, 11) },
  ];

  // actividades is enforced immutable by a BEFORE UPDATE OR DELETE trigger
  // (migration 007). Fixed per-row UUIDs + `ignoreDuplicates: true` make
  // re-seeding safe: ON CONFLICT DO NOTHING never fires the trigger, and
  // existing rows from prior runs are silently skipped.
  const withIds = actividades.map((a, i) => ({
    id: `90000000-0000-4000-a000-${String(i + 1).padStart(12, '0')}`,
    ...a,
  }));

  const { error } = await supabase
    .from('actividades')
    .upsert(withIds, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw new Error(`Activities: ${error.message}`);
}
