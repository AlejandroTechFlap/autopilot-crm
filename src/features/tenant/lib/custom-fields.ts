/**
 * Phase 10 — pure helpers for custom fields and brand.
 *
 * No imports from `next/*` or `@/lib/supabase/*`. Validators, mappers and
 * the JSONB strip helper live here so server, client and test code share
 * the exact same logic (DRY rule).
 */

import type {
  CampoPersonalizado,
  CampoPersonalizadoRow,
  CustomFieldValue,
  CustomFieldsMap,
  FeatureFlag,
  TenantBrand,
  TenantConfig,
  TenantConfigRow,
  TenantFlags,
} from '../types';
import { FEATURE_FLAGS } from '../types';

/* ===== Brand / config mappers ===== */

/** Hex color regex used both client-side and server-side. */
export const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** Slug regex matching the SQL CHECK on `campos_personalizados.clave`. */
export const CAMPO_CLAVE_RE = /^[a-z][a-z0-9_]*$/;

/** Map a raw DB row into the loader-friendly TenantConfig view. */
export function mapTenantRow(row: TenantConfigRow): TenantConfig {
  const brand: TenantBrand = {
    nombre_empresa: row.nombre_empresa,
    logo_url: row.logo_url,
    color_primario: row.color_primario,
    color_acento: row.color_acento,
    direccion: row.direccion,
    email_contacto: row.email_contacto,
    telefono: row.telefono,
  };
  const flags: TenantFlags = {
    feat_ai_chat: row.feat_ai_chat,
    feat_morning_summary: row.feat_morning_summary,
    feat_command_palette: row.feat_command_palette,
    feat_dashboard_historico: row.feat_dashboard_historico,
    feat_admin_kpis: row.feat_admin_kpis,
    feat_admin_scripts: row.feat_admin_scripts,
    feat_notifications: row.feat_notifications,
    feat_empresa_task_cal: row.feat_empresa_task_cal,
    feat_ai_lead_capture: row.feat_ai_lead_capture,
    feat_ai_next_action: row.feat_ai_next_action,
    feat_ai_command_palette: row.feat_ai_command_palette,
  };
  return {
    id: row.id,
    brand,
    flags,
    updated_at: row.updated_at,
  };
}

/** True iff the given key is a known feature flag. */
export function isFeatureFlag(key: string): key is FeatureFlag {
  return (FEATURE_FLAGS as readonly string[]).includes(key);
}

/* ===== Custom field definitions ===== */

/** Map a DB row to the form/admin view, narrowing `opciones` to string[]. */
export function mapCampoRow(row: CampoPersonalizadoRow): CampoPersonalizado {
  let opciones: string[] | null = null;
  if (row.tipo === 'seleccion' && Array.isArray(row.opciones)) {
    opciones = row.opciones.filter((o): o is string => typeof o === 'string');
  }
  return {
    id: row.id,
    entidad: row.entidad,
    clave: row.clave,
    etiqueta: row.etiqueta,
    tipo: row.tipo,
    opciones,
    orden: row.orden,
    obligatorio: row.obligatorio,
    created_at: row.created_at,
  };
}

/* ===== Custom field values ===== */

/**
 * Validate a single value against its definition.
 * Returns null on success, or a Spanish error string on failure.
 */
export function validateCampoValue(
  def: CampoPersonalizado,
  raw: CustomFieldValue
): string | null {
  // Empty handling: required vs optional.
  const isEmpty = raw === null || raw === '' || raw === undefined;
  if (isEmpty) {
    if (def.obligatorio) return `${def.etiqueta} es obligatorio`;
    return null;
  }

  switch (def.tipo) {
    case 'texto':
      if (typeof raw !== 'string') return `${def.etiqueta} debe ser texto`;
      return null;
    case 'numero':
      if (typeof raw !== 'number' || Number.isNaN(raw))
        return `${def.etiqueta} debe ser un número`;
      return null;
    case 'booleano':
      if (typeof raw !== 'boolean') return `${def.etiqueta} debe ser sí/no`;
      return null;
    case 'fecha':
      if (typeof raw !== 'string' || Number.isNaN(Date.parse(raw)))
        return `${def.etiqueta} debe ser una fecha válida`;
      return null;
    case 'seleccion':
      if (typeof raw !== 'string')
        return `${def.etiqueta} debe ser una opción`;
      if (!def.opciones?.includes(raw))
        return `${def.etiqueta} contiene una opción inválida`;
      return null;
  }
}

/**
 * Validate a full map of values against the list of definitions for one entity.
 * Returns `{ ok: true, sanitized }` with only known keys, or `{ ok: false, errors }`.
 */
export function validateCamposPersonalizados(
  defs: CampoPersonalizado[],
  values: CustomFieldsMap
):
  | { ok: true; sanitized: CustomFieldsMap }
  | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const sanitized: CustomFieldsMap = {};
  for (const def of defs) {
    const raw = values[def.clave] ?? null;
    const error = validateCampoValue(def, raw);
    if (error) {
      errors[def.clave] = error;
      continue;
    }
    // Drop empty optional values so JSONB stays compact.
    const isEmpty = raw === null || raw === '' || raw === undefined;
    if (!isEmpty) sanitized[def.clave] = raw;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, sanitized };
}

/**
 * Render a stored value for read-only display (detail page, kanban hover).
 * Returns a Spanish-localised string. `null` becomes em-dash.
 */
export function renderCampoValue(
  def: CampoPersonalizado,
  raw: CustomFieldValue
): string {
  if (raw === null || raw === undefined || raw === '') return '—';
  switch (def.tipo) {
    case 'texto':
    case 'seleccion':
      return String(raw);
    case 'numero':
      return typeof raw === 'number' ? raw.toLocaleString('es-ES') : String(raw);
    case 'booleano':
      return raw ? 'Sí' : 'No';
    case 'fecha':
      if (typeof raw !== 'string') return String(raw);
      try {
        return new Date(raw).toLocaleDateString('es-ES');
      } catch {
        return raw;
      }
  }
}
