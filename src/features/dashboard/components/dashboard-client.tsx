'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KpiTile } from './kpi-tile';
import { ChartCard } from './dashboard-charts';
import { VendedorTable } from './vendedor-table';
import { KpiDrillDialog } from './kpi-drill-dialog';
import { useDashboardKpis, useChartData } from '../hooks/use-dashboard';
import { formatCurrency } from '@/lib/formatting';
import type { DrillType, Periodo } from '../types';

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: '7d', label: '7 días' },
  { value: 'month', label: 'Este mes' },
  { value: 'quarter', label: 'Trimestre' },
];

function pctChange(current: number, previous: number): number | undefined {
  if (previous === 0) return current === 0 ? 0 : undefined;
  return ((current - previous) / previous) * 100;
}

export function DashboardClient() {
  const [periodo, setPeriodo] = useState<Periodo>('month');
  const [drillTipo, setDrillTipo] = useState<DrillType | null>(null);
  const { data, loading } = useDashboardKpis(periodo);

  // Sparkline data for KPI tiles
  const { series: pipelineSpark } = useChartData('pipeline_value', periodo);
  const { series: wonSpark } = useChartData('deals_ganados', periodo);
  const { series: actSpark } = useChartData('actividades', periodo);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <div className="flex gap-1">
          {PERIODOS.map((p) => (
            <Button
              key={p.value}
              size="sm"
              variant={periodo === p.value ? 'default' : 'outline'}
              onClick={() => setPeriodo(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando KPIs...</p>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiTile
              label="Valor del pipeline"
              value={formatCurrency(data.kpis.total_pipeline_value)}
              sparklineData={pipelineSpark}
              onClick={() => setDrillTipo('pipeline_value')}
            />
            <KpiTile
              label="Negocios ganados"
              value={String(data.kpis.deals_ganados)}
              sparklineData={wonSpark}
              deltaPct={pctChange(data.kpis.deals_ganados, data.prev_kpis.deals_ganados)}
              onClick={() => setDrillTipo('deals_ganados')}
            />
            <KpiTile
              label="Tasa de conversión"
              value={`${data.kpis.tasa_conversion}%`}
              deltaPct={pctChange(data.kpis.tasa_conversion, data.prev_kpis.tasa_conversion)}
              onClick={() => setDrillTipo('conversion')}
            />
            <KpiTile
              label="Ticket medio"
              value={formatCurrency(data.kpis.ticket_medio)}
              deltaPct={pctChange(data.kpis.ticket_medio, data.prev_kpis.ticket_medio)}
              onClick={() => setDrillTipo('ticket_medio')}
            />
            <KpiTile
              label="Tareas vencidas"
              value={String(data.kpis.tareas_vencidas)}
              alertColor={data.kpis.tareas_vencidas > 0}
              onClick={() => setDrillTipo('tareas_vencidas')}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 sm:grid-cols-2">
            <ChartCard
              title="Valor del pipeline"
              tipo="pipeline_value"
              periodo={periodo}
              variant="area"
              color="#0D7377"
            />
            <ChartCard
              title="Negocios ganados"
              tipo="deals_ganados"
              periodo={periodo}
              variant="bar"
              color="#14B8A6"
            />
            <ChartCard
              title="Actividades"
              tipo="actividades"
              periodo={periodo}
              variant="line"
              color="#0E9488"
            />
            <ChartCard
              title="Tasa de conversión"
              tipo="conversion"
              periodo={periodo}
              variant="line"
              color="#F59E0B"
            />
          </div>

          {/* Per-seller table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Por vendedor</CardTitle>
            </CardHeader>
            <CardContent>
              <VendedorTable data={data.por_vendedor} />
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No se han podido cargar los datos del dashboard.</p>
      )}

      <KpiDrillDialog
        open={drillTipo !== null}
        onOpenChange={(o) => {
          if (!o) setDrillTipo(null);
        }}
        tipo={drillTipo}
        periodo={periodo}
      />
    </div>
  );
}
