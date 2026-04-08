import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { jsonError } from '@/lib/api-utils';
import { requireAdmin } from '@/features/admin/lib/admin-guard';
import { assertFeatureFlag } from '@/features/tenant/lib/feature-flag-guard';

/** GET — list all KPI configs. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const blocked = await assertFeatureFlag('feat_admin_kpis');
  if (blocked) return blocked;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('kpi_config')
    .select('id, tipo, periodo, objetivo, umbral_verde, umbral_ambar')
    .order('tipo', { ascending: true });

  if (error) {
    return jsonError('Failed to load KPIs: ' + error.message);
  }

  return Response.json({ kpis: data ?? [] });
}

const KpiUpdateSchema = z.object({
  id: z.string().uuid(),
  objetivo: z.number().nullable().optional(),
  umbral_verde: z.number().nullable().optional(),
  umbral_ambar: z.number().nullable().optional(),
});

const BulkPatchSchema = z.object({
  kpis: z.array(KpiUpdateSchema),
});

/** PATCH — bulk-update KPI thresholds. */
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;
  const blocked = await assertFeatureFlag('feat_admin_kpis');
  if (blocked) return blocked;

  const json = await request.json().catch(() => null);
  const parsed = BulkPatchSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError('Invalid payload', 400);
  }

  const supabase = await createClient();

  for (const kpi of parsed.data.kpis) {
    const { id, ...updates } = kpi;
    const { error } = await supabase
      .from('kpi_config')
      .update(updates)
      .eq('id', id);
    if (error) {
      return jsonError(`Failed to update ${id}: ${error.message}`);
    }
  }

  return Response.json({ ok: true });
}
