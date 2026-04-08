import { requireAuth } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { getTenantConfig } from '@/features/tenant/lib/get-tenant-config';
import { TenantProvider } from '@/features/tenant/lib/tenant-context';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, tenant] = await Promise.all([requireAuth(), getTenantConfig()]);

  // Inject tenant brand colours as CSS variables on the layout root so the
  // existing Tailwind tokens (`--primary`, `--accent`) pick them up at render
  // time without a flash. The sidebar / buttons read these vars via shadcn.
  const brandStyle = {
    '--brand-primary': tenant.brand.color_primario,
    '--brand-accent': tenant.brand.color_acento,
  } as React.CSSProperties;

  return (
    <div style={brandStyle} className="contents">
      <TenantProvider value={tenant}>
        <DashboardShell user={user} tenant={tenant}>
          {children}
        </DashboardShell>
      </TenantProvider>
    </div>
  );
}
