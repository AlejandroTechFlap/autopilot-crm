'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Kanban,
  ListTodo,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import type { CrmUser } from '@/lib/auth';
import type { Database } from '@/types/database';

type RolUsuario = Database['public']['Enums']['rol_usuario'];

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: RolUsuario[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/pipeline', label: 'Pipeline', icon: Kanban, roles: ['admin', 'direccion', 'vendedor'] },
  { href: '/mis-tareas', label: 'Mis tareas', icon: ListTodo, roles: ['admin', 'direccion', 'vendedor'] },
  { href: '/empresas', label: 'Empresas', icon: Building2, roles: ['admin', 'direccion', 'vendedor'] },
  { href: '/contactos', label: 'Contactos', icon: Users, roles: ['admin', 'direccion', 'vendedor'] },
  { href: '/dashboard', label: 'Panel', icon: BarChart3, roles: ['admin', 'direccion'] },
  { href: '/admin', label: 'Ajustes', icon: Settings, roles: ['admin'] },
];

interface SidebarProps {
  user: CrmUser;
}

/** Desktop sidebar — hidden on mobile */
export function Sidebar({ user }: SidebarProps) {
  return (
    <aside className="hidden h-full w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <SidebarContent user={user} />
    </aside>
  );
}

/** Mobile sidebar — Sheet overlay */
export function MobileSidebar({
  user,
  open,
  onOpenChange,
}: SidebarProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-60 p-0" showCloseButton={false}>
        <SheetTitle className="sr-only">Navegación</SheetTitle>
        <SidebarContent user={user} onNavigate={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}

function SidebarContent({
  user,
  onNavigate,
}: {
  user: CrmUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(user.rol)
  );

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">
          Autopilot CRM
        </span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-3">
        {visibleItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User info */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            {user.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {user.nombre}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {user.email}
            </p>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </form>
      </div>
    </div>
  );
}
