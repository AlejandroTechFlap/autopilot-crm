import type { SupabaseClient } from '@supabase/supabase-js';
import { EMPRESA_IDS, CONTACTO_IDS } from './ids';

export async function seedContacts(supabase: SupabaseClient) {
  console.log('  Creating contacts...');

  const contactos = [
    // PetShop Madrid (2)
    { id: CONTACTO_IDS.CARLOS_RUIZ, empresa_id: EMPRESA_IDS.PETSHOP_MADRID, nombre_completo: 'Carlos Ruiz', cargo: 'Propietario', telefono: '+34 612 345 678', email: 'carlos@petshopmadrid.es', es_principal: true },
    { id: CONTACTO_IDS.MARIA_LOPEZ, empresa_id: EMPRESA_IDS.PETSHOP_MADRID, nombre_completo: 'Maria Lopez', cargo: 'Responsable de compras', telefono: '+34 612 345 679', email: 'maria@petshopmadrid.es', es_principal: false },

    // VetPartners (1)
    { id: CONTACTO_IDS.JAVIER_TORRES, empresa_id: EMPRESA_IDS.VETPARTNERS, nombre_completo: 'Dr. Javier Torres', cargo: 'Director General', telefono: '+34 633 456 789', email: 'jtorres@vetpartners.es', es_principal: true },

    // AgroVet (2)
    { id: CONTACTO_IDS.ANA_MARTIN, empresa_id: EMPRESA_IDS.AGROVET, nombre_completo: 'Ana Martin', cargo: 'Directora de Operaciones', telefono: '+34 644 567 890', email: 'amartin@agrovet.es', es_principal: true },
    { id: CONTACTO_IDS.PEDRO_SANCHEZ, empresa_id: EMPRESA_IDS.AGROVET, nombre_completo: 'Pedro Sanchez', cargo: 'Director Financiero', telefono: '+34 644 567 891', email: 'psanchez@agrovet.es', es_principal: false },

    // Mascotas Felices (1)
    { id: CONTACTO_IDS.LUCIA_FERNANDEZ, empresa_id: EMPRESA_IDS.MASCOTAS_FELICES, nombre_completo: 'Lucia Fernandez', cargo: 'CEO', telefono: '+34 655 678 901', email: 'lucia@mascotasfelices.es', es_principal: true },

    // PetFood Express (1)
    { id: CONTACTO_IDS.ROBERTO_GARCIA, empresa_id: EMPRESA_IDS.PETFOOD_EXPRESS, nombre_completo: 'Roberto Garcia', cargo: 'Fundador', telefono: '+34 666 789 012', email: 'roberto@petfoodexpress.es', es_principal: true },

    // Clinica Sol (2)
    { id: CONTACTO_IDS.ELENA_MORENO, empresa_id: EMPRESA_IDS.CLINICA_SOL, nombre_completo: 'Dra. Elena Moreno', cargo: 'Directora Clinica', telefono: '+34 677 890 123', email: 'emoreno@clinicasol.es', es_principal: true },
    { id: CONTACTO_IDS.MARCOS_DIAZ, empresa_id: EMPRESA_IDS.CLINICA_SOL, nombre_completo: 'Marcos Diaz', cargo: 'Administrador', telefono: '+34 677 890 124', email: 'mdiaz@clinicasol.es', es_principal: false },

    // Animalia (1)
    { id: CONTACTO_IDS.PATRICIA_JIMENEZ, empresa_id: EMPRESA_IDS.ANIMALIA, nombre_completo: 'Patricia Jimenez', cargo: 'Gerente', telefono: '+34 688 901 234', email: 'patricia@animaliastore.es', es_principal: true },

    // VetSalud (1)
    { id: CONTACTO_IDS.FERNANDO_LOPEZ, empresa_id: EMPRESA_IDS.VETSALUD, nombre_completo: 'Dr. Fernando Lopez', cargo: 'Fundador y CEO', telefono: '+34 699 012 345', email: 'flopez@vetsalud.es', es_principal: true },

    // PetCorner (2)
    { id: CONTACTO_IDS.ISABEL_HERRERO, empresa_id: EMPRESA_IDS.PETCORNER, nombre_completo: 'Isabel Herrero', cargo: 'CEO', telefono: '+34 610 123 456', email: 'isabel@petcorner.es', es_principal: true },
    { id: CONTACTO_IDS.MIKEL_ETXEBARRIA, empresa_id: EMPRESA_IDS.PETCORNER, nombre_completo: 'Mikel Etxebarria', cargo: 'Director Comercial', telefono: '+34 610 123 457', email: 'mikel@petcorner.es', es_principal: false },

    // ZooRetail (1)
    { id: CONTACTO_IDS.ANDRES_ROMERO, empresa_id: EMPRESA_IDS.ZOORETAIL, nombre_completo: 'Andres Romero', cargo: 'Propietario', telefono: '+34 621 234 567', email: 'andres@zooretail.es', es_principal: true },

    // Nutrivet (1)
    { id: CONTACTO_IDS.ROSA_VAZQUEZ, empresa_id: EMPRESA_IDS.NUTRIVET, nombre_completo: 'Rosa Vazquez', cargo: 'Directora Comercial', telefono: '+34 632 345 678', email: 'rvazquez@nutrivet.es', es_principal: true },
  ];

  const { error } = await supabase.from('contactos').upsert(contactos);
  if (error) throw new Error(`Contacts: ${error.message}`);
}
