'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useChartData } from '../hooks/use-dashboard';
import type { Periodo } from '../types';

interface ChartCardProps {
  title: string;
  tipo: 'pipeline_value' | 'deals_ganados' | 'actividades' | 'conversion';
  periodo: Periodo;
  variant: 'area' | 'bar' | 'line';
  color?: string;
}

function formatTick(value: string): string {
  const d = new Date(value);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function ChartCard({ title, tipo, periodo, variant, color = '#0D7377' }: ChartCardProps) {
  const { series, loading } = useChartData(tipo, periodo);
  const isPercent = tipo === 'conversion';
  const yFormatter = (v: number) => (isPercent ? `${v}%` : String(v));
  const tooltipFormatter = (value: unknown): [string, string] => {
    const n = typeof value === 'number' ? value : Number(value ?? 0);
    return isPercent ? [`${n}%`, 'Tasa'] : [String(n), 'Valor'];
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              {variant === 'area' ? (
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id={`grad-${tipo}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" />
                  <XAxis dataKey="fecha" tickFormatter={formatTick} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={50} tickFormatter={yFormatter} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke={color}
                    strokeWidth={2.5}
                    fill={`url(#grad-${tipo})`}
                  />
                </AreaChart>
              ) : variant === 'bar' ? (
                <BarChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" />
                  <XAxis dataKey="fecha" tickFormatter={formatTick} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={50} tickFormatter={yFormatter} />
                  <Tooltip formatter={tooltipFormatter} />
                  <Bar dataKey="valor" fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" />
                  <XAxis dataKey="fecha" tickFormatter={formatTick} tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={50}
                    tickFormatter={yFormatter}
                    domain={isPercent ? [0, 100] : ['auto', 'auto']}
                  />
                  <Tooltip formatter={tooltipFormatter} />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke={color}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
