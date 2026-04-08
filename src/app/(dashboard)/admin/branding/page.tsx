/**
 * Phase 10 — admin branding screen.
 *
 * Loads the singleton tenant config on the server and hands it to the
 * client form. Auth is enforced once at the parent admin layout via
 * `requireRole('admin')`, so this file does not repeat the check.
 */

import { getTenantConfig } from '@/features/tenant/lib/get-tenant-config';
import { BrandingForm } from '@/features/admin/branding/branding-form';

export default async function AdminBrandingPage() {
  const tenant = await getTenantConfig();
  return <BrandingForm initial={tenant} />;
}
