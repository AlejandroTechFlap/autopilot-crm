import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Phase 10 seed — tenant config singleton + custom field definitions.
 *
 * Why this lives in its own file: `configuracion_tenant` is created by
 * migration 010 via `INSERT DEFAULT VALUES`, so we must UPDATE the existing
 * row (a second INSERT would violate the singleton unique index). Keeping
 * it alongside the custom-field definitions makes the Phase 10 surface a
 * single "tenant layer" seed module.
 *
 * The values populated on specific empresas/contactos/deals live in their
 * own seed files — this file only defines the *schema* (definitions) and
 * the tenant branding/feature-flag singleton.
 */
export async function seedTenantConfig(supabase: SupabaseClient) {
  console.log('  Updating tenant config singleton...');

  // Migration 010 runs `INSERT INTO configuracion_tenant DEFAULT VALUES`, so
  // a row already exists. We UPDATE it (matching all rows — there is only
  // one by the singleton unique index).
  const { error } = await supabase
    .from('configuracion_tenant')
    .update({
      nombre_empresa: 'Autopilot CRM Demo',
      color_primario: '#0f172a',
      color_acento: '#3b82f6',
      email_contacto: 'hola@autopilotcrm.com',
      telefono: '+34 900 123 456',
      feat_ai_chat: true,
      feat_morning_summary: true,
      feat_command_palette: true,
      feat_dashboard_historico: true,
      feat_admin_kpis: true,
      feat_admin_scripts: true,
      feat_notifications: true,
      feat_empresa_task_cal: true,
      feat_ai_lead_capture: true,
      feat_ai_next_action: true,
      feat_ai_command_palette: true,
    })
    .not('id', 'is', null);

  if (error) throw new Error(`Tenant config: ${error.message}`);
}

export async function seedCustomFieldDefinitions(supabase: SupabaseClient) {
  console.log('  Creating custom field definitions...');

  const definitions = [
    // ===== empresa =====
    {
      entidad: 'empresa',
      clave: 'cif',
      etiqueta: 'CIF',
      tipo: 'texto',
      opciones: null,
      orden: 1,
      obligatorio: true,
    },
    {
      entidad: 'empresa',
      clave: 'num_empleados',
      etiqueta: 'Nº empleados',
      tipo: 'numero',
      opciones: null,
      orden: 2,
      obligatorio: false,
    },
    {
      entidad: 'empresa',
      clave: 'es_cliente_vip',
      etiqueta: 'Cliente VIP',
      tipo: 'booleano',
      opciones: null,
      orden: 3,
      obligatorio: false,
    },
    // ===== contacto =====
    {
      entidad: 'contacto',
      clave: 'linkedin_url',
      etiqueta: 'LinkedIn',
      tipo: 'texto',
      opciones: null,
      orden: 1,
      obligatorio: false,
    },
    {
      entidad: 'contacto',
      clave: 'preferencia_contacto',
      etiqueta: 'Canal preferido',
      tipo: 'seleccion',
      opciones: ['llamada', 'email', 'whatsapp'],
      orden: 2,
      obligatorio: false,
    },
    // ===== deal =====
    {
      entidad: 'deal',
      clave: 'fuente_lead',
      etiqueta: 'Fuente del lead',
      tipo: 'seleccion',
      opciones: ['organico', 'referido', 'publicidad', 'evento'],
      orden: 1,
      obligatorio: false,
    },
    {
      entidad: 'deal',
      clave: 'probabilidad_cierre',
      etiqueta: 'Probabilidad de cierre (%)',
      tipo: 'numero',
      opciones: null,
      orden: 2,
      obligatorio: false,
    },
  ];

  // Idempotent via the UNIQUE (entidad, clave) constraint.
  const { error } = await supabase
    .from('campos_personalizados')
    .upsert(definitions, { onConflict: 'entidad,clave' });

  if (error) throw new Error(`Custom field definitions: ${error.message}`);
}
