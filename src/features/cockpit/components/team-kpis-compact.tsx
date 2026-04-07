'use client';

import Link from 'next/link';
import {
  TrendingUp,
  Briefcase,
  Trophy,
  Percent,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatting';
import { useTeamKpis } from '../hooks/use-team-kpis';

interface DeltaBadgeProps {
  current: number;
  previous: number;
}

function DeltaBadge({ current, previous }: DeltaBadgeProps) {
  if (previous === 0 && current === 0) return null;
  const pct = previous === 0 ? 100 : ((current - previous) / previous) * 100;
  const isFlat = Math.abs(pct) < 0.5;
  const isUp = pct > 0 && !isFlat;
  const color = isFlat
    ? 'text-muted-foreground'
    : isUp
      ? 'text-success'
      : 'text-danger';
  const Icon = isFlat ? Minus : isUp ? ArrowUp : ArrowDown;
  const label = isFlat ? '0%' : `${pct > 0 ? '+' : ''}${Math.round(pct)}%`;
  return (
    <span className={`flex items-center gap-0.5 text-[10px] ${color}`}>
      <Icon className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

export function TeamKpisCompact() {
  const { kpis, prevKpis, loading, error } = useTeamKpis();

  if (loading) {
    return <p className="text-xs text-muted-foreground">Cargando KPIs...</p>;
  }

  if (error || !kpis) {
    return (
      <p className="text-xs text-muted-foreground">
        No se pudieron cargar los KPIs.
      </p>
    );
  }

  const items = [
    {
      key: 'pipeline',
      label: 'Pipeline total',
      icon: TrendingUp,
      value: formatCurrency(kpis.total_pipeline_value),
      delta: null,
    },
    {
      key: 'open',
      label: 'Negocios abiertos',
      icon: Briefcase,
      value: String(kpis.deals_abiertos),
      delta: null,
    },
    {
      key: 'won',
      label: 'Ganados (mes)',
      icon: Trophy,
      value: `${kpis.deals_ganados} · ${formatCurrency(kpis.valor_ganado)}`,
      delta: prevKpis ? (
        <DeltaBadge
          current={kpis.deals_ganados}
          previous={prevKpis.deals_ganados}
        />
      ) : null,
    },
    {
      key: 'conv',
      label: 'Tasa conversión',
      icon: Percent,
      value: `${kpis.tasa_conversion}%`,
      delta: prevKpis ? (
        <DeltaBadge
          current={kpis.tasa_conversion}
          previous={prevKpis.tasa_conversion}
        />
      ) : null,
    },
    {
      key: 'overdue',
      label: 'Tareas vencidas (equipo)',
      icon: AlertTriangle,
      value: String(kpis.tareas_vencidas),
      delta: null,
      alert: kpis.tareas_vencidas > 0,
    },
  ];

  return (
    <div className="space-y-2">
      {items.map(({ key, label, icon: Icon, value, delta, alert }) => (
        <Card key={key} className={alert ? 'border-danger/30' : ''}>
          <CardContent className="flex items-center gap-3 py-2.5 px-3">
            <Icon
              className={`h-4 w-4 shrink-0 ${alert ? 'text-danger' : 'text-muted-foreground'}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="flex items-center gap-2">
                <p
                  className={`text-sm font-semibold ${alert ? 'text-danger' : ''}`}
                >
                  {value}
                </p>
                {delta}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Link
        href="/dashboard"
        className="block pt-1 text-right text-xs text-muted-foreground underline-offset-2 hover:underline"
      >
        Ver detalle →
      </Link>
    </div>
  );
}
