'use client';

import {
  Briefcase,
  TrendingUp,
  ListTodo,
  AlertTriangle,
  Activity,
  Trophy,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatting';
import type { PersonalKpis as PersonalKpisType } from '../types';

interface PersonalKpisProps {
  kpis: PersonalKpisType | null;
  loading: boolean;
}

const KPI_ITEMS: {
  key: keyof PersonalKpisType;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  format: (v: number) => string;
  alertWhen?: (v: number) => boolean;
}[] = [
  {
    key: 'deals_abiertos',
    label: 'Oportunidades abiertas',
    icon: Briefcase,
    format: (v) => String(v),
  },
  {
    key: 'valor_pipeline',
    label: 'Valor del embudo',
    icon: TrendingUp,
    format: (v) => formatCurrency(v),
  },
  {
    key: 'tareas_pendientes',
    label: 'Tareas pendientes',
    sublabel: 'Incluye hoy y futuras',
    icon: ListTodo,
    format: (v) => String(v),
  },
  {
    key: 'tareas_vencidas',
    label: 'Tareas vencidas',
    sublabel: 'Fecha límite pasada',
    icon: AlertTriangle,
    format: (v) => String(v),
    alertWhen: (v) => v > 0,
  },
  {
    key: 'actividades_hoy',
    label: 'Actividades hoy',
    icon: Activity,
    format: (v) => String(v),
  },
  {
    key: 'deals_ganados_mes',
    label: 'Ganados este mes',
    icon: Trophy,
    format: (v) => String(v),
  },
  {
    key: 'comision_mes',
    label: 'Comisión',
    icon: DollarSign,
    format: (v) => formatCurrency(v),
  },
];

export function PersonalKpis({ kpis, loading }: PersonalKpisProps) {
  if (loading || !kpis) {
    return <p className="text-xs text-muted-foreground">Cargando KPIs...</p>;
  }

  return (
    <div className="space-y-2">
      {KPI_ITEMS.map(({ key, label, sublabel, icon: Icon, format, alertWhen }) => {
        const value = kpis[key];
        const isAlert = alertWhen?.(value) ?? false;

        return (
          <Card key={key} className={isAlert ? 'border-danger/30' : ''}>
            <CardContent className="flex items-center gap-3 py-2.5 px-3">
              <Icon
                className={`h-4 w-4 shrink-0 ${isAlert ? 'text-danger' : 'text-muted-foreground'}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p
                  className={`text-sm font-semibold ${isAlert ? 'text-danger' : ''}`}
                >
                  {format(value)}
                </p>
                {sublabel && (
                  <p className="text-[10px] text-muted-foreground">{sublabel}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
