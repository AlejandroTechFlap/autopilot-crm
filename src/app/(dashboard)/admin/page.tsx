import Link from 'next/link';
import { Kanban, FileText, Users, Bell, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

interface OverviewTile {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number | string;
  description: string;
}

async function loadCounts() {
  const supabase = await createClient();
  const [pipelines, phases, scripts, users, notifs, kpis] = await Promise.all([
    supabase.from('pipelines').select('id', { count: 'exact', head: true }),
    supabase.from('fases').select('id', { count: 'exact', head: true }),
    supabase.from('scripts').select('id', { count: 'exact', head: true }),
    supabase.from('usuarios').select('id', { count: 'exact', head: true }),
    supabase.from('notificacion_config').select('id', { count: 'exact', head: true }),
    supabase.from('kpi_config').select('id', { count: 'exact', head: true }),
  ]);
  return {
    pipelines: pipelines.count ?? 0,
    phases: phases.count ?? 0,
    scripts: scripts.count ?? 0,
    users: users.count ?? 0,
    notifs: notifs.count ?? 0,
    kpis: kpis.count ?? 0,
  };
}

export default async function AdminOverviewPage() {
  const counts = await loadCounts();

  const tiles: OverviewTile[] = [
    {
      href: '/admin/pipelines',
      label: 'Pipelines',
      icon: Kanban,
      count: `${counts.pipelines} / ${counts.phases}`,
      description: 'Pipelines · fases',
    },
    {
      href: '/admin/scripts',
      label: 'Scripts',
      icon: FileText,
      count: counts.scripts,
      description: 'Scripts de ventas',
    },
    {
      href: '/admin/usuarios',
      label: 'Usuarios',
      icon: Users,
      count: counts.users,
      description: 'Miembros del equipo',
    },
    {
      href: '/admin/notificaciones',
      label: 'Notificaciones',
      icon: Bell,
      count: counts.notifs,
      description: 'Reglas de disparo',
    },
    {
      href: '/admin/kpis',
      label: 'KPIs',
      icon: BarChart3,
      count: counts.kpis,
      description: 'Reglas de umbral',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Link key={tile.href} href={tile.href} className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {tile.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{tile.count}</p>
                <p className="text-xs text-muted-foreground">{tile.description}</p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
