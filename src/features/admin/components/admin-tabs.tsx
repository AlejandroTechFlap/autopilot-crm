'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTenantConfig } from '@/features/tenant/lib/tenant-context';
import type { FeatureFlag } from '@/features/tenant/types';

interface AdminTab {
  href: string;
  label: string;
  /** Hide this tab entirely when this feature flag is off (decision D4). */
  flag?: FeatureFlag;
}

const TABS: AdminTab[] = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/branding', label: 'Marca' },
  { href: '/admin/funcionalidades', label: 'Funcionalidades' },
  { href: '/admin/pipelines', label: 'Pipelines' },
  { href: '/admin/campos', label: 'Campos' },
  { href: '/admin/scripts', label: 'Scripts', flag: 'feat_admin_scripts' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  {
    href: '/admin/notificaciones',
    label: 'Notificaciones',
    flag: 'feat_notifications',
  },
  { href: '/admin/kpis', label: 'KPIs', flag: 'feat_admin_kpis' },
];

export function AdminTabs() {
  const pathname = usePathname();
  const tenant = useTenantConfig();

  const visibleTabs = TABS.filter((tab) => {
    if (tab.flag && !tenant.flags[tab.flag]) return false;
    return true;
  });

  return (
    <nav className="flex gap-1 border-b border-border">
      {visibleTabs.map((tab) => {
        const isActive =
          tab.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
