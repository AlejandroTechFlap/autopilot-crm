import { CamposManager } from '@/features/admin/campos/campos-manager';

/**
 * Phase 10 — `/admin/campos` page entry.
 *
 * Custom fields are a core Phase 10 feature (no flag gate). Admin access is
 * enforced by the parent `(dashboard)/admin/layout.tsx` via `requireRole('admin')`
 * so no guard is needed here.
 */
export default function AdminCamposPage() {
  return <CamposManager />;
}
