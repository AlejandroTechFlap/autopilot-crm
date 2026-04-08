/**
 * Phase 10 — admin funcionalidades screen.
 *
 * Loads the singleton tenant config on the server and hands it to the
 * client toggles form. Auth is enforced once at the parent admin layout via
 * `requireRole('admin')`, so this file does not repeat the check.
 */

import { getTenantConfig } from '@/features/tenant/lib/get-tenant-config';
import { FeatureToggles } from '@/features/admin/funcionalidades/feature-toggles';

export default async function AdminFuncionalidadesPage() {
  const tenant = await getTenantConfig();
  return <FeatureToggles initial={tenant} />;
}
