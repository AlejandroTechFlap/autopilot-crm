'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AdminTab {
  href: string;
  label: string;
}

const TABS: AdminTab[] = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/pipelines', label: 'Pipelines' },
  { href: '/admin/scripts', label: 'Scripts' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/admin/notificaciones', label: 'Notificaciones' },
  { href: '/admin/kpis', label: 'KPIs' },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border">
      {TABS.map((tab) => {
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
