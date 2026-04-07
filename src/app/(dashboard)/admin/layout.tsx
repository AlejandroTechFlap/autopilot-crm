import { requireRole } from '@/lib/auth';
import { AdminTabs } from '@/features/admin/components/admin-tabs';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole('admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure pipelines, scripts, users, notifications and KPIs.
        </p>
      </div>
      <AdminTabs />
      <div>{children}</div>
    </div>
  );
}
