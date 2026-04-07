'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, DollarSign, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatting';
import { FUENTE_LABELS } from '@/lib/constants';
import { SEMAPHORE_DOT_CLASSES } from '../lib/semaphore';
import { QuickActivity } from './quick-activity';
import type { PipelineDeal } from '../types';

interface DealCardProps {
  deal: PipelineDeal;
  onClick?: (deal: PipelineDeal) => void;
}

export function DealCard({ deal, onClick }: DealCardProps) {
  const [quickOpen, setQuickOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: { type: 'deal', deal },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fuenteLabel =
    FUENTE_LABELS[deal.empresa.fuente_lead as keyof typeof FUENTE_LABELS] ??
    deal.empresa.fuente_lead;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => onClick?.(deal)}
        className={cn(
          'group cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
          isDragging && 'opacity-50 shadow-lg'
        )}
      >
        {/* Header: company name + quick action + semaphore */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-tight text-foreground">
            {deal.empresa.nombre}
          </h4>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuickOpen(true);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
              title="Registrar actividad rápida"
              aria-label="Registrar actividad rápida"
            >
              <Zap className="h-3.5 w-3.5" />
            </button>
            <span
              className={cn(
                'mt-0.5 h-2.5 w-2.5 rounded-full',
                SEMAPHORE_DOT_CLASSES[deal.semaphore]
              )}
              title={`${deal.days_in_phase}d en fase (${deal.semaphore_pct}%)`}
            />
          </div>
        </div>

        {/* Value */}
        <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-foreground">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          {formatCurrency(deal.valor)}
        </div>

        {/* Meta row */}
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {deal.days_in_phase}d
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {deal.vendedor.nombre.split(' ')[0]}
          </span>
        </div>

        {/* Source tag */}
        <div className="mt-2">
          <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {fuenteLabel}
          </span>
        </div>

        {/* Next action */}
        {deal.empresa.proxima_accion && (
          <p className="mt-1.5 truncate text-xs text-muted-foreground">
            Siguiente: {deal.empresa.proxima_accion}
          </p>
        )}
      </div>

      <QuickActivity
        empresaId={deal.empresa.id}
        empresaNombre={deal.empresa.nombre}
        dealId={deal.id}
        open={quickOpen}
        onOpenChange={setQuickOpen}
      />
    </>
  );
}
