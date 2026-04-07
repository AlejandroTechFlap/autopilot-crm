import { requireRole } from '@/lib/auth';
import { DashboardClient } from '@/features/dashboard/components/dashboard-client';

export default async function DashboardPage() {
  await requireRole('admin', 'direccion');
  return <DashboardClient />;
}
