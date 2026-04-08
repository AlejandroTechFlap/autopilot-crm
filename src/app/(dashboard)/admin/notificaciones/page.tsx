import { NotificacionRulesEditor } from '@/features/admin/components/notificacion-rules-editor';
import { requireFeatureFlag } from '@/features/tenant/lib/feature-flag-guard';

export default async function AdminNotificacionesPage() {
  await requireFeatureFlag('feat_notifications');
  return <NotificacionRulesEditor />;
}
