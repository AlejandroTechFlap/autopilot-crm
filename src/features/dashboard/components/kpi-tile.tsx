'use client';

import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ChartPoint } from '../types';

interface KpiTileProps {
  label: string;
  value: string;
  sparklineData?: ChartPoint[];
  alertColor?: boolean;
  /**
   * Delta vs previous period as a percentage. Positive = up, negative = down.
   * Pass undefined to hide the delta.
   */
  deltaPct?: number;
  /** When true, a positive delta is bad (e.g. overdue tasks). */
  invertDelta?: boolean;
  onClick?: () => void;
}

function formatDelta(pct: number): string {
  const abs = Math.abs(pct);
  if (abs >= 1000) return `${Math.round(pct / 100) * 100}%`;
  return `${pct > 0 ? '+' : ''}${Math.round(pct)}%`;
}

export function KpiTile({
  label,
  value,
  sparklineData,
  alertColor,
  deltaPct,
  invertDelta,
  onClick,
}: KpiTileProps) {
  const hasDelta = typeof deltaPct === 'number' && Number.isFinite(deltaPct);
  const isFlat = hasDelta && Math.abs(deltaPct) < 0.5;
  const isUp = hasDelta && deltaPct > 0 && !isFlat;
  const goodWhenUp = !invertDelta;
  const isGood = isFlat ? true : isUp === goodWhenUp;
  const deltaColor = isFlat
    ? 'text-muted-foreground'
    : isGood
      ? 'text-success'
      : 'text-danger';
  const DeltaIcon = isFlat ? Minus : isUp ? ArrowUp : ArrowDown;

  return (
    <Card
      className={`${alertColor ? 'border-danger/30' : ''} ${
        onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between py-4 px-5">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={`mt-1 text-2xl font-bold ${alertColor ? 'text-danger' : ''}`}
          >
            {value}
          </p>
          {hasDelta && (
            <div className={`mt-1 flex items-center gap-0.5 text-xs ${deltaColor}`}>
              <DeltaIcon className="h-3 w-3" />
              <span>{formatDelta(deltaPct)}</span>
              <span className="ml-0.5 text-muted-foreground">vs prev</span>
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="h-10 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`spark-${label.replace(/\s+/g, '-').toLowerCase()}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={alertColor ? '#DC2626' : '#0D7377'}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={alertColor ? '#DC2626' : '#0D7377'}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke={alertColor ? '#DC2626' : '#0D7377'}
                  strokeWidth={1.5}
                  fill={`url(#spark-${label.replace(/\s+/g, '-').toLowerCase()})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
