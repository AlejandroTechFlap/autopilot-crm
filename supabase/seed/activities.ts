import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserMap } from './users';
import { EMPRESA_IDS, CONTACTO_IDS, DEAL_IDS } from './ids';

export async function seedActivities(supabase: SupabaseClient, users: UserMap) {
  console.log('  Creating activities...');

  const actividades = [
    // --- PetShop Madrid (2) ---
    { empresa_id: EMPRESA_IDS.PETSHOP_MADRID, tipo: 'sistema', contenido: 'Lead creado desde campana de Google Ads', usuario_id: users.admin, created_at: '2026-03-25T10:00:00Z' },
    { empresa_id: EMPRESA_IDS.PETSHOP_MADRID, contacto_id: CONTACTO_IDS.CARLOS_RUIZ, deal_id: DEAL_IDS.PETSHOP, tipo: 'llamada', contenido: 'Primer contacto con Carlos Ruiz. Interesado en linea premium de alimentacion para mascotas.', usuario_id: users.ignacio, created_at: '2026-04-06T09:30:00Z' },

    // --- VetPartners Barcelona (4) ---
    { empresa_id: EMPRESA_IDS.VETPARTNERS, tipo: 'sistema', contenido: 'Lead creado por referido de Dr. Martinez', usuario_id: users.admin, created_at: '2026-03-10T09:00:00Z' },
    { empresa_id: EMPRESA_IDS.VETPARTNERS, contacto_id: CONTACTO_IDS.JAVIER_TORRES, deal_id: DEAL_IDS.VETPARTNERS, tipo: 'llamada', contenido: 'Contacto inicial con Dr. Torres. Cadena de 3 clinicas veterinarias en Barcelona.', usuario_id: users.ignacio, created_at: '2026-03-11T10:00:00Z' },
    { empresa_id: EMPRESA_IDS.VETPARTNERS, deal_id: DEAL_IDS.VETPARTNERS, tipo: 'cambio_fase', contenido: 'Deal avanzo a Contacto Inicial', usuario_id: users.ignacio, created_at: '2026-03-12T14:00:00Z' },
    { empresa_id: EMPRESA_IDS.VETPARTNERS, contacto_id: CONTACTO_IDS.JAVIER_TORRES, deal_id: DEAL_IDS.VETPARTNERS, tipo: 'reunion', contenido: 'Reunion presencial en Barcelona. Presentacion de catalogo completo de productos.', usuario_id: users.ignacio, created_at: '2026-03-14T16:00:00Z' },

    // --- AgroVet Levante (3) ---
    { empresa_id: EMPRESA_IDS.AGROVET, tipo: 'sistema', contenido: 'Lead captado en feria AgroExpo 2026', usuario_id: users.admin, created_at: '2026-03-20T11:00:00Z' },
    { empresa_id: EMPRESA_IDS.AGROVET, contacto_id: CONTACTO_IDS.ANA_MARTIN, deal_id: DEAL_IDS.AGROVET, tipo: 'llamada', contenido: 'Primera llamada con Ana Martin. Interesada en suministros veterinarios para zona Levante.', usuario_id: users.laura, created_at: '2026-03-25T10:00:00Z' },
    { empresa_id: EMPRESA_IDS.AGROVET, deal_id: DEAL_IDS.AGROVET, tipo: 'cambio_fase', contenido: 'Deal avanzo a Contacto Inicial', usuario_id: users.laura, created_at: '2026-03-28T15:00:00Z' },

    // --- Mascotas Felices (4) ---
    { empresa_id: EMPRESA_IDS.MASCOTAS_FELICES, tipo: 'sistema', contenido: 'Lead organico desde formulario web', usuario_id: users.admin, created_at: '2026-03-05T10:00:00Z' },
    { empresa_id: EMPRESA_IDS.MASCOTAS_FELICES, contacto_id: CONTACTO_IDS.LUCIA_FERNANDEZ, deal_id: DEAL_IDS.MASCOTAS, tipo: 'llamada', contenido: 'Contacto con Lucia Fernandez. Tiene 2 tiendas en Madrid centro.', usuario_id: users.ignacio, created_at: '2026-03-06T11:00:00Z' },
    { empresa_id: EMPRESA_IDS.MASCOTAS_FELICES, deal_id: DEAL_IDS.MASCOTAS, tipo: 'cambio_fase', contenido: 'Deal avanzo rapidamente: Propuesta → Negociacion → Cierre', usuario_id: users.ignacio, created_at: '2026-03-18T14:00:00Z' },
    { empresa_id: EMPRESA_IDS.MASCOTAS_FELICES, deal_id: DEAL_IDS.MASCOTAS, tipo: 'nota', contenido: 'Deal cerrado como GANADO. Contrato firmado por 60.000 EUR. Cliente muy satisfecha.', usuario_id: users.ignacio, created_at: '2026-03-25T16:00:00Z' },

    // --- PetFood Express (2) ---
    { empresa_id: EMPRESA_IDS.PETFOOD_EXPRESS, tipo: 'sistema', contenido: 'Lead de cold call', usuario_id: users.admin, created_at: '2026-04-03T14:00:00Z' },
    { empresa_id: EMPRESA_IDS.PETFOOD_EXPRESS, contacto_id: CONTACTO_IDS.ROBERTO_GARCIA, deal_id: DEAL_IDS.PETFOOD, tipo: 'llamada', contenido: 'Llamada en frio a Roberto Garcia. Interesado pero pide mas informacion por email.', usuario_id: users.laura, created_at: '2026-04-04T10:00:00Z' },

    // --- Clinica Sol (3) ---
    { empresa_id: EMPRESA_IDS.CLINICA_SOL, tipo: 'sistema', contenido: 'Lead referido por Dr. Torres (VetPartners Barcelona)', usuario_id: users.admin, created_at: '2026-03-15T09:00:00Z' },
    { empresa_id: EMPRESA_IDS.CLINICA_SOL, contacto_id: CONTACTO_IDS.ELENA_MORENO, deal_id: DEAL_IDS.CLINICA, tipo: 'llamada', contenido: 'Contacto con Dra. Elena Moreno. Clinica grande con 15 empleados. Necesitan suministros.', usuario_id: users.laura, created_at: '2026-03-17T11:00:00Z' },
    { empresa_id: EMPRESA_IDS.CLINICA_SOL, deal_id: DEAL_IDS.CLINICA, tipo: 'cambio_fase', contenido: 'Deal avanzo a Propuesta Enviada. Propuesta enviada por email.', usuario_id: users.laura, created_at: '2026-03-30T14:00:00Z' },

    // --- Animalia Store (2) ---
    { empresa_id: EMPRESA_IDS.ANIMALIA, tipo: 'sistema', contenido: 'Lead importado de base de datos externa', usuario_id: users.admin, created_at: '2026-03-22T10:00:00Z' },
    { empresa_id: EMPRESA_IDS.ANIMALIA, contacto_id: CONTACTO_IDS.PATRICIA_JIMENEZ, deal_id: DEAL_IDS.ANIMALIA, tipo: 'llamada', contenido: 'Primera llamada con Patricia. Tienda mediana en Valencia, busca proveedor de alimentacion.', usuario_id: users.ignacio, created_at: '2026-03-28T15:00:00Z' },

    // --- VetSalud Plus (2) ---
    { empresa_id: EMPRESA_IDS.VETSALUD, tipo: 'sistema', contenido: 'Lead captado desde campana de Google Ads', usuario_id: users.admin, created_at: '2026-04-01T08:00:00Z' },
    { empresa_id: EMPRESA_IDS.VETSALUD, tipo: 'nota', contenido: 'Web visitada varias veces. Pendiente de primera llamada de contacto.', usuario_id: users.laura, created_at: '2026-04-02T09:00:00Z' },

    // --- PetCorner Bilbao (4) ---
    { empresa_id: EMPRESA_IDS.PETCORNER, tipo: 'sistema', contenido: 'Lead referido por partner comercial', usuario_id: users.admin, created_at: '2026-02-20T10:00:00Z' },
    { empresa_id: EMPRESA_IDS.PETCORNER, contacto_id: CONTACTO_IDS.ISABEL_HERRERO, deal_id: DEAL_IDS.PETCORNER, tipo: 'llamada', contenido: 'Contacto con Isabel Herrero (CEO). Muy interesada en linea premium.', usuario_id: users.ignacio, created_at: '2026-02-22T11:00:00Z' },
    { empresa_id: EMPRESA_IDS.PETCORNER, contacto_id: CONTACTO_IDS.ISABEL_HERRERO, deal_id: DEAL_IDS.PETCORNER, tipo: 'reunion', contenido: 'Reunion de cierre en Bilbao. Acuerdo alcanzado.', usuario_id: users.ignacio, created_at: '2026-03-08T16:00:00Z' },
    { empresa_id: EMPRESA_IDS.PETCORNER, deal_id: DEAL_IDS.PETCORNER, tipo: 'nota', contenido: 'Deal cerrado como GANADO. Contrato firmado por 90.000 EUR.', usuario_id: users.ignacio, created_at: '2026-03-10T10:00:00Z' },

    // --- ZooRetail Sevilla (1) ---
    { empresa_id: EMPRESA_IDS.ZOORETAIL, tipo: 'sistema', contenido: 'Lead organico desde buscador', usuario_id: users.admin, created_at: '2026-04-04T12:00:00Z' },

    // --- Nutrivet Galicia (3) ---
    { empresa_id: EMPRESA_IDS.NUTRIVET, tipo: 'sistema', contenido: 'Lead de cold call', usuario_id: users.admin, created_at: '2026-03-01T09:00:00Z' },
    { empresa_id: EMPRESA_IDS.NUTRIVET, contacto_id: CONTACTO_IDS.ROSA_VAZQUEZ, deal_id: DEAL_IDS.NUTRIVET, tipo: 'llamada', contenido: 'Contacto frio con Rosa Vazquez. Empresa pequena de suplementos veterinarios.', usuario_id: users.ignacio, created_at: '2026-03-05T10:00:00Z' },
    { empresa_id: EMPRESA_IDS.NUTRIVET, deal_id: DEAL_IDS.NUTRIVET, tipo: 'nota', contenido: 'Deal PERDIDO. No tienen presupuesto disponible para este trimestre.', usuario_id: users.ignacio, created_at: '2026-03-20T15:00:00Z' },
  ];

  // Insert in batches (actividades are immutable — no upsert possible)
  const { error } = await supabase.from('actividades').insert(actividades);
  if (error) {
    if (error.message?.includes('duplicate')) {
      console.log('    Activities already exist, skipping...');
      return;
    }
    throw new Error(`Activities: ${error.message}`);
  }
}
