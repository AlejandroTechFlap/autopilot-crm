/**
 * Phase 10 — Spanish labels for the /admin/campos screen.
 *
 * Kept in a tiny pure module so the manager + dialog can share the copy
 * without duplicating strings or growing past the 300-line cap.
 */

import type { Entidad, TipoCampo } from '@/features/tenant/types';

export const ENTIDAD_LABELS: Record<Entidad, string> = {
  empresa: 'Empresas',
  contacto: 'Contactos',
  deal: 'Oportunidades',
};

export const TIPO_LABELS: Record<TipoCampo, string> = {
  texto: 'Texto',
  numero: 'Número',
  seleccion: 'Selección',
  fecha: 'Fecha',
  booleano: 'Sí / No',
};

export const ENTIDADES: Entidad[] = ['empresa', 'contacto', 'deal'];
export const TIPOS: TipoCampo[] = [
  'texto',
  'numero',
  'seleccion',
  'fecha',
  'booleano',
];

/** Slugify a user-typed label into a valid JSONB key for `clave`. */
export function slugifyClave(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 40);
}
