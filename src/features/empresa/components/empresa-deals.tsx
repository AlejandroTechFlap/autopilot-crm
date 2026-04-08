'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatting';
import {
  calculateSemaphore,
  SEMAPHORE_DOT_CLASSES,
} from '@/features/pipeline/lib/semaphore';

interface Deal {
  id: string;
  valor: number;
  fase_actual: string;
  resultado: 'ganado' | 'perdido' | null;
  cerrado_en: string | null;
  fecha_entrada_fase: string;
  created_at: string;
  fase: { nombre: string; tiempo_esperado: number | null } | null;
}

interface EmpresaDealsProps {
  deals: Deal[];
}

const RESULTADO_BADGE: Record<string, { label: string; className: string }> = {
  ganado: { label: 'Ganada', className: 'bg-success-light text-success' },
  perdido: { label: 'Perdida', className: 'bg-danger-light text-danger' },
};

export function EmpresaDeals({ deals }: EmpresaDealsProps) {
  if (deals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aún no hay oportunidades.</p>
    );
  }

  const openDeals = deals.filter((d) => !d.resultado);
  const closedDeals = deals.filter((d) => d.resultado);

  return (
    <div className="space-y-4">
      {openDeals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">
            Abiertas ({openDeals.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {openDeals.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </div>
      )}

      {closedDeals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium uppercase text-muted-foreground">
            Cerradas ({closedDeals.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {closedDeals.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const semaphore = deal.resultado
    ? null
    : calculateSemaphore(
        deal.fecha_entrada_fase,
        deal.fase?.tiempo_esperado ?? null
      );

  const resultadoBadge = deal.resultado
    ? RESULTADO_BADGE[deal.resultado]
    : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {semaphore && (
              <span
                className={`h-2 w-2 rounded-full ${SEMAPHORE_DOT_CLASSES[semaphore.color]}`}
              />
            )}
            <span className="text-sm font-medium">
              {deal.fase?.nombre ?? 'Fase desconocida'}
            </span>
          </div>
          {resultadoBadge && (
            <Badge variant="secondary" className={resultadoBadge.className}>
              {resultadoBadge.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span className="font-medium text-foreground">
            {formatCurrency(deal.valor)}
          </span>
          {semaphore && (
            <span className="text-xs">
              {semaphore.daysInPhase}d en fase
              {semaphore.percentage > 0 && ` (${semaphore.percentage}%)`}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
