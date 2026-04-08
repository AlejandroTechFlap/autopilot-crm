/**
 * Phase 10 — zod schemas for the custom-field admin routes.
 *
 * Kept in a standalone file so both the POST and PATCH handlers can
 * share the validation definition without duplication. Pure module —
 * no imports from `next/*` or `@/lib/supabase/*`.
 */

import { z } from 'zod';
import { CAMPO_CLAVE_RE } from '@/features/tenant/lib/custom-fields';

const ENTIDADES = ['empresa', 'contacto', 'deal'] as const;
const TIPOS = ['texto', 'numero', 'seleccion', 'fecha', 'booleano'] as const;

/** Options list shared by create and update payloads. */
const OpcionesArray = z
  .array(z.string().min(1).max(80))
  .min(1, 'Añade al menos una opción')
  .max(50, 'Máximo 50 opciones');

/** POST body — every required field must be present. */
export const CreateCampoSchema = z
  .object({
    entidad: z.enum(ENTIDADES),
    clave: z
      .string()
      .min(1)
      .max(40)
      .regex(CAMPO_CLAVE_RE, 'Clave inválida (usa minúsculas, números y _)'),
    etiqueta: z.string().min(1).max(80),
    tipo: z.enum(TIPOS),
    opciones: OpcionesArray.optional(),
    orden: z.number().int().min(0).max(999).optional(),
    obligatorio: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) => v.tipo !== 'seleccion' || (v.opciones && v.opciones.length > 0),
    { message: 'El tipo selección requiere opciones', path: ['opciones'] }
  );

/**
 * PATCH body — every field optional; `clave` and `entidad` are immutable
 * after create (enforced by omitting them from the schema).
 */
export const UpdateCampoSchema = z
  .object({
    etiqueta: z.string().min(1).max(80).optional(),
    tipo: z.enum(TIPOS).optional(),
    opciones: OpcionesArray.nullable().optional(),
    orden: z.number().int().min(0).max(999).optional(),
    obligatorio: z.boolean().optional(),
  })
  .strict();

export type CreateCampoInput = z.infer<typeof CreateCampoSchema>;
export type UpdateCampoInput = z.infer<typeof UpdateCampoSchema>;
