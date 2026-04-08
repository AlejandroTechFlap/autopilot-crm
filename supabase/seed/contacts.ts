import type { SupabaseClient } from '@supabase/supabase-js';
import { EMPRESA_IDS, CONTACTO_IDS } from './ids';

export async function seedContacts(supabase: SupabaseClient) {
  console.log('  Creating contacts...');

  const contactos = [
    // PetShop Madrid (2)
    { id: CONTACTO_IDS.CARLOS_RUIZ, empresa_id: EMPRESA_IDS.PETSHOP_MADRID, nombre_completo: 'Carlos Ruiz', cargo: 'Propietario', telefono: '+34 612 345 678', email: 'carlos@petshopmadrid.es', es_principal: true },
    { id: CONTACTO_IDS.MARIA_LOPEZ, empresa_id: EMPRESA_IDS.PETSHOP_MADRID, nombre_completo: 'Maria Lopez', cargo: 'Responsable de compras', telefono: '+34 612 345 679', email: 'maria@petshopmadrid.es', es_principal: false },

    // VetPartners (1) — Phase 10 campos on principal
    { id: CONTACTO_IDS.JAVIER_TORRES, empresa_id: EMPRESA_IDS.VETPARTNERS, nombre_completo: 'Dr. Javier Torres', cargo: 'Director General', telefono: '+34 633 456 789', email: 'jtorres@vetpartners.es', es_principal: true, campos_personalizados: { linkedin_url: 'https://linkedin.com/in/javier-torres-vet', preferencia_contacto: 'email' } },

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

    // PetCorner (2) — Phase 10 campos on principal
    { id: CONTACTO_IDS.ISABEL_HERRERO, empresa_id: EMPRESA_IDS.PETCORNER, nombre_completo: 'Isabel Herrero', cargo: 'CEO', telefono: '+34 610 123 456', email: 'isabel@petcorner.es', es_principal: true, campos_personalizados: { linkedin_url: 'https://linkedin.com/in/isabel-herrero', preferencia_contacto: 'llamada' } },
    { id: CONTACTO_IDS.MIKEL_ETXEBARRIA, empresa_id: EMPRESA_IDS.PETCORNER, nombre_completo: 'Mikel Etxebarria', cargo: 'Director Comercial', telefono: '+34 610 123 457', email: 'mikel@petcorner.es', es_principal: false },

    // ZooRetail (1)
    { id: CONTACTO_IDS.ANDRES_ROMERO, empresa_id: EMPRESA_IDS.ZOORETAIL, nombre_completo: 'Andres Romero', cargo: 'Propietario', telefono: '+34 621 234 567', email: 'andres@zooretail.es', es_principal: true },

    // Nutrivet (1)
    { id: CONTACTO_IDS.ROSA_VAZQUEZ, empresa_id: EMPRESA_IDS.NUTRIVET, nombre_completo: 'Rosa Vazquez', cargo: 'Directora Comercial', telefono: '+34 632 345 678', email: 'rvazquez@nutrivet.es', es_principal: true },

    // ===== Phase "Mock Data Overhaul" — coverage additions =====
    // EcoPets (2) — ex_cliente, reactivable
    { id: CONTACTO_IDS.SERGIO_NAVARRO, empresa_id: EMPRESA_IDS.ECOPETS, nombre_completo: 'Sergio Navarro', cargo: 'Director General', telefono: '+34 655 111 222', email: 'snavarro@ecopets.es', es_principal: true },
    { id: CONTACTO_IDS.CLARA_GIL, empresa_id: EMPRESA_IDS.ECOPETS, nombre_completo: 'Clara Gil', cargo: 'Responsable de compras', telefono: '+34 655 111 223', email: 'cgil@ecopets.es', es_principal: false },

    // VetNorte (2) — contactado, rural asturias
    { id: CONTACTO_IDS.DAVID_RUBIO, empresa_id: EMPRESA_IDS.VETNORTE, nombre_completo: 'David Rubio', cargo: 'Coordinador', telefono: '+34 667 222 333', email: 'drubio@vetnorte.es', es_principal: true },
    { id: CONTACTO_IDS.BEATRIZ_CANO, empresa_id: EMPRESA_IDS.VETNORTE, nombre_completo: 'Beatriz Cano', cargo: 'Tesorera', telefono: '+34 667 222 334', email: 'bcano@vetnorte.es', es_principal: false },

    // Mascotas Sur (1) — nueva apertura malaga
    { id: CONTACTO_IDS.OSCAR_PRIETO, empresa_id: EMPRESA_IDS.MASCOTAS_SUR, nombre_completo: 'Oscar Prieto', cargo: 'Propietario', telefono: '+34 678 333 444', email: 'oscar@mascotasdelsur.es', es_principal: true },

    // PetBoutique (2) — cliente premium madrid
    { id: CONTACTO_IDS.NURIA_CASTRO, empresa_id: EMPRESA_IDS.PETBOUTIQUE, nombre_completo: 'Nuria Castro', cargo: 'CEO', telefono: '+34 689 444 555', email: 'nuria@petboutique.es', es_principal: true },
    { id: CONTACTO_IDS.ALVARO_SERRA, empresa_id: EMPRESA_IDS.PETBOUTIQUE, nombre_completo: 'Alvaro Serra', cargo: 'Responsable Marketing', telefono: '+34 689 444 556', email: 'alvaro@petboutique.es', es_principal: false },

    // VetLab (3) — cliente mixto (won/lost)
    { id: CONTACTO_IDS.TERESA_MOLINA, empresa_id: EMPRESA_IDS.VETLAB, nombre_completo: 'Dra. Teresa Molina', cargo: 'Directora Cientifica', telefono: '+34 690 555 666', email: 'tmolina@vetlab.es', es_principal: true, campos_personalizados: { linkedin_url: 'https://linkedin.com/in/teresa-molina-vet', preferencia_contacto: 'whatsapp' } },
    { id: CONTACTO_IDS.RAMON_BLANCO, empresa_id: EMPRESA_IDS.VETLAB, nombre_completo: 'Ramon Blanco', cargo: 'Director Financiero', telefono: '+34 690 555 667', email: 'rblanco@vetlab.es', es_principal: false },
    { id: CONTACTO_IDS.VICTORIA_PUIG, empresa_id: EMPRESA_IDS.VETLAB, nombre_completo: 'Victoria Puig', cargo: 'Jefa de Compras', telefono: '+34 690 555 668', email: 'vpuig@vetlab.es', es_principal: false },
  ];

  // `campos_personalizados` is NOT NULL — inject empty default for rows
  // that don't set it explicitly (Supabase bulk upsert sends missing keys as null).
  const rows = contactos.map((c) => ({ campos_personalizados: {}, ...c }));
  const { error } = await supabase.from('contactos').upsert(rows);
  if (error) throw new Error(`Contacts: ${error.message}`);
}
