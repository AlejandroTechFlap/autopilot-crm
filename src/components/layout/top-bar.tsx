'use client';

import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

const ROUTE_TITLES: Record<string, string> = {
  '/pipeline': 'Embudo',
  '/mis-tareas': 'Mis tareas',
  '/empresas': 'Empresas',
  '/contactos': 'Contactos',
  '/dashboard': 'Panel',
  '/admin': 'Ajustes',
};

interface TopBarProps {
  actions?: React.ReactNode;
  onMenuClick?: () => void;
}

export function TopBar({ actions, onMenuClick }: TopBarProps) {
  const pathname = usePathname();

  const title =
    ROUTE_TITLES[pathname] ??
    (pathname.startsWith('/empresa/') ? 'Detalle de empresa' : 'Autopilot CRM');

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground lg:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
        <NotificationBell />
      </div>
    </header>
  );
}
