/**
 * PATCH /api/admin/tenant
 *
 * Phase 10 — partial update of the singleton `configuracion_tenant` row.
 * Brand fields and feature flags share the same endpoint so the branding
 * screen and the funcionalidades screen both PATCH here.
 *
 * Admin-only. RLS in migration 010 is the second line of defence.
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';
import { createClient } from '@/lib/supabase/server';
import { HEX_COLOR_RE } from '@/features/tenant/lib/custom-fields';

const HexColor = z.string().regex(HEX_COLOR_RE, 'Color hex inválido');
const NullableTrimmedString = z
  .string()
  .max(200)
  .nullable()
  .optional()
  .transform((v) => (typeof v === 'string' ? v.trim() || null : v ?? null));

const PatchSchema = z
  .object({
    nombre_empresa: z.string().min(1).max(120).optional(),
    logo_url: z.string().url().nullable().optional(),
    color_primario: HexColor.optional(),
    color_acento: HexColor.optional(),
    direccion: NullableTrimmedString,
    email_contacto: z
      .string()
      .email()
      .nullable()
      .optional()
      .transform((v) => v ?? null),
    telefono: NullableTrimmedString,
    feat_ai_chat: z.boolean().optional(),
    feat_morning_summary: z.boolean().optional(),
    feat_command_palette: z.boolean().optional(),
    feat_dashboard_historico: z.boolean().optional(),
    feat_admin_kpis: z.boolean().optional(),
    feat_admin_scripts: z.boolean().optional(),
    feat_notifications: z.boolean().optional(),
    feat_empresa_task_cal: z.boolean().optional(),
  })
  .strict();

export async function PATCH(request: Request): Promise<Response> {
  const auth = await requireAdmin();
  if (auth instanceof Response) {
    logger.warn({ scope: 'api.admin.tenant', event: 'forbidden' });
    return auth;
  }

  const json = await request.json().catch(() => null);
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    logger.warn({
      scope: 'api.admin.tenant',
      event: 'invalid',
      issues: parsed.error.issues.length,
    });
    return jsonError('Invalid payload', 400);
  }

  // Drop undefined keys so we only PATCH the supplied fields.
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) updates[key] = value;
  }
  if (Object.keys(updates).length === 0) {
    return jsonError('No fields to update', 400);
  }
  updates.updated_by = auth.id;

  const supabase = await createClient();
  // Singleton: update every row (there is only one). The `((TRUE))` unique
  // index in migration 010 enforces the invariant.
  const { error } = await supabase
    .from('configuracion_tenant')
    .update(updates as never)
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    logger.error({
      scope: 'api.admin.tenant',
      event: 'failed',
      userId: auth.id,
      err: error,
    });
    return jsonError('Failed to update tenant config: ' + error.message, 500);
  }

  logger.info({
    scope: 'api.admin.tenant',
    event: 'updated',
    userId: auth.id,
    fields: Object.keys(updates).filter((k) => k !== 'updated_by'),
  });
  return Response.json({ ok: true });
}
