import Link from 'next/link';
import {
  Kanban,
  FileText,
  Users,
  Bell,
  BarChart3,
  Palette,
  ToggleLeft,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { getTenantConfig } from '@/features/tenant/lib/get-tenant-config';
import type { FeatureFlag } from '@/features/tenant/types';

interface OverviewTile {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number | string;
  description: string;
  /** Hide this tile entirely when this feature flag is off (decision D4). */
  flag?: FeatureFlag;
}

async function loadCounts() {
  const supabase = await createClient();
  const [pipelines, phases, scripts, users, notifs, kpis, campos] =
    await Promise.all([
      supabase.from('pipelines').select('id', { count: 'exact', head: true }),
      supabase.from('fases').select('id', { count: 'exact', head: true }),
      supabase.from('scripts').select('id', { count: 'exact', head: true }),
      supabase.from('usuarios').select('id', { count: 'exact', head: true }),
      supabase
        .from('notificacion_config')
        .select('id', { count: 'exact', head: true }),
      supabase.from('kpi_config').select('id', { count: 'exact', head: true }),
      supabase
        .from('campos_personalizados')
        .select('id', { count: 'exact', head: true }),
    ]);
  return {
    pipelines: pipelines.count ?? 0,
    phases: phases.count ?? 0,
    scripts: scripts.count ?? 0,
    users: users.count ?? 0,
    notifs: notifs.count ?? 0,
    kpis: kpis.count ?? 0,
    campos: campos.count ?? 0,
  };
}

export default async function AdminOverviewPage() {
  const [counts, tenant] = await Promise.all([loadCounts(), getTenantConfig()]);

  const activeFlagCount = Object.values(tenant.flags).filter(Boolean).length;
  const totalFlagCount = Object.keys(tenant.flags).length;

  const tiles: OverviewTile[] = [
    {
      href: '/admin/branding',
      label: 'Marca',
      icon: Palette,
      count: tenant.brand.nombre_empresa,
      description: 'Logo, colores y datos',
    },
    {
      href: '/admin/funcionalidades',
      label: 'Funcionalidades',
      icon: ToggleLeft,
      count: `${activeFlagCount} / ${totalFlagCount}`,
      description: 'Módulos activos',
    },
    {
      href: '/admin/pipelines',
      label: 'Pipelines',
      icon: Kanban,
      count: `${counts.pipelines} / ${counts.phases}`,
      description: 'Pipelines · fases',
    },
    {
      href: '/admin/campos',
      label: 'Campos',
      icon: SlidersHorizontal,
      count: counts.campos,
      description: 'Campos personalizados',
    },
    {
      href: '/admin/scripts',
      label: 'Scripts',
      icon: FileText,
      count: counts.scripts,
      description: 'Scripts de ventas',
      flag: 'feat_admin_scripts',
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
      flag: 'feat_notifications',
    },
    {
      href: '/admin/kpis',
      label: 'KPIs',
      icon: BarChart3,
      count: counts.kpis,
      description: 'Reglas de umbral',
      flag: 'feat_admin_kpis',
    },
  ];

  const visibleTiles = tiles.filter(
    (tile) => !tile.flag || tenant.flags[tile.flag]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visibleTiles.map((tile) => {
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
