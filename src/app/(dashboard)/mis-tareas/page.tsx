import { requireAuth } from '@/lib/auth';
import { CockpitClient } from '@/features/cockpit/components/cockpit-client';

export default async function MisTareasPage() {
  const user = await requireAuth();
  return <CockpitClient userId={user.id} userRole={user.rol} />;
}
