import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserMap } from './users';
import { PIPELINE_ID, FASE_IDS } from './ids';

export async function seedPipeline(supabase: SupabaseClient, users: UserMap) {
  console.log('  Creating pipeline...');

  const { error: pipeError } = await supabase.from('pipelines').upsert({
    id: PIPELINE_ID,
    nombre: 'Retail mascotas',
    created_by: users.admin,
  });
  if (pipeError) throw new Error(`Pipeline: ${pipeError.message}`);

  console.log('  Creating phases...');
  const phases = [
    { id: FASE_IDS.NUEVO_LEAD, nombre: 'Nuevo Lead', orden: 1, tiempo_esperado: 1 },
    { id: FASE_IDS.CONTACTO_INICIAL, nombre: 'Contacto Inicial', orden: 2, tiempo_esperado: 2 },
    { id: FASE_IDS.PROPUESTA, nombre: 'Propuesta Enviada', orden: 3, tiempo_esperado: 5 },
    { id: FASE_IDS.NEGOCIACION, nombre: 'Negociacion', orden: 4, tiempo_esperado: 7 },
    { id: FASE_IDS.CIERRE, nombre: 'Cierre', orden: 5, tiempo_esperado: 10 },
    { id: FASE_IDS.POSTVENTA, nombre: 'Postventa', orden: 6, tiempo_esperado: null },
  ];

  for (const phase of phases) {
    const { error } = await supabase.from('fases').upsert({
      ...phase,
      pipeline_id: PIPELINE_ID,
    });
    if (error) throw new Error(`Phase ${phase.nombre}: ${error.message}`);
  }
}
