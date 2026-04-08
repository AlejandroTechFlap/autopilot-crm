import { KpiThresholdsEditor } from '@/features/admin/components/kpi-thresholds-editor';
import { requireFeatureFlag } from '@/features/tenant/lib/feature-flag-guard';

export default async function AdminKpisPage() {
  await requireFeatureFlag('feat_admin_kpis');
  return <KpiThresholdsEditor />;
}
