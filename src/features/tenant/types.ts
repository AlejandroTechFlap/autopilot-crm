/**
 * Phase 10 — tenant types
 *
 * Pure types only. NO imports from `next/*`, `@/lib/supabase/*`, or anything
 * effectful. Safe to import from server, client, or test code.
 */

import type { Database } from '@/types/database';

/** Row shape for the singleton `configuracion_tenant` table. */
export type TenantConfigRow = Database['public']['Tables']['configuracion_tenant']['Row'];

/** Row shape for `campos_personalizados`. */
export type CampoPersonalizadoRow =
  Database['public']['Tables']['campos_personalizados']['Row'];

/** Three entities that accept custom fields. */
export type Entidad = Database['public']['Enums']['entidad_personalizable'];

/** Five supported custom-field types. */
export type TipoCampo = Database['public']['Enums']['tipo_campo_personalizado'];

/**
 * Feature flags catalog. v1 shipped 8 in migration 010; Phase 12 added 3 more
 * (lead capture, próxima acción, command-palette IA) in migration 013.
 */
export const FEATURE_FLAGS = [
  'feat_ai_chat',
  'feat_morning_summary',
  'feat_command_palette',
  'feat_dashboard_historico',
  'feat_admin_kpis',
  'feat_admin_scripts',
  'feat_notifications',
  'feat_empresa_task_cal',
  'feat_ai_lead_capture',
  'feat_ai_next_action',
  'feat_ai_command_palette',
] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

/**
 * The brand subset of `configuracion_tenant`. Sidebar + layout consume this
 * shape; the form below screens edits it.
 */
export interface TenantBrand {
  nombre_empresa: string;
  logo_url: string | null;
  color_primario: string;
  color_acento: string;
  direccion: string | null;
  email_contacto: string | null;
  telefono: string | null;
}

/** All flags as a plain `Record<FeatureFlag, boolean>`. */
export type TenantFlags = Record<FeatureFlag, boolean>;

/**
 * Loader-friendly view: brand + flags split out so callers don't accidentally
 * touch bookkeeping fields (`updated_at`, `updated_by`).
 */
export interface TenantConfig {
  id: string;
  brand: TenantBrand;
  flags: TenantFlags;
  updated_at: string;
}

/**
 * Strict JSONB shape for `entity.campos_personalizados`. A single discriminated
 * union — never `any`. Null is allowed so a user can clear an optional field
 * without dropping the key.
 */
export type CustomFieldValue = string | number | boolean | null;
export type CustomFieldsMap = Record<string, CustomFieldValue>;

/**
 * Definition view used by forms and admin tooling. `opciones` is narrowed
 * from `Json` to a string array so dropdown rendering does not need to cast.
 */
export interface CampoPersonalizado {
  id: string;
  entidad: Entidad;
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  /** Only set for `tipo === 'seleccion'`. */
  opciones: string[] | null;
  orden: number;
  obligatorio: boolean;
  created_at: string;
}
