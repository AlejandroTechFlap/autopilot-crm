import { ScriptManager } from '@/features/admin/components/script-manager';
import { requireFeatureFlag } from '@/features/tenant/lib/feature-flag-guard';

export default async function AdminScriptsPage() {
  await requireFeatureFlag('feat_admin_scripts');
  return <ScriptManager />;
}
