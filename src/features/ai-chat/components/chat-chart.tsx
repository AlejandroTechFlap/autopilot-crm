'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChartWidget } from '../types';

const COLORS = [
  '#0D7377', '#E8943A', '#6366F1', '#EC4899',
  '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444',
];

interface ChatChartProps {
  widget: ChartWidget;
}

export function ChatChart({ widget }: ChatChartProps) {
  const { chartType, title, data, xLabel, yLabel } = widget;

  return (
    <div className="mt-2 rounded-lg border bg-background p-3">
      <p className="mb-2 text-xs font-semibold text-foreground">{title}</p>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={(entry: { label?: string; name?: string; percent?: number }) =>
                  `${entry.label ?? entry.name ?? ''} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : chartType === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`cg-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.45} />
                  <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -2, fontSize: 10 } : undefined} />
              <YAxis tick={{ fontSize: 10 }} width={45} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 10 } : undefined} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} fill={`url(#cg-${widget.id})`} />
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -2, fontSize: 10 } : undefined} />
              <YAxis tick={{ fontSize: 10 }} width={45} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 10 } : undefined} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={COLORS[0]} strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E4E9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -2, fontSize: 10 } : undefined} />
              <YAxis tick={{ fontSize: 10 }} width={45} label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', fontSize: 10 } : undefined} />
              <Tooltip />
              <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
