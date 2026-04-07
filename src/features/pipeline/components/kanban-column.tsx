'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatting';
import { DealCard } from './deal-card';
import type { PipelineFase, PipelineDeal } from '../types';

interface KanbanColumnProps {
  fase: PipelineFase;
  onDealClick?: (deal: PipelineDeal) => void;
}

export function KanbanColumn({ fase, onDealClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${fase.id}`,
    data: { type: 'column', faseId: fase.id },
  });

  const totalValue = fase.deals.reduce((sum, d) => sum + d.valor, 0);
  const dealIds = fase.deals.map((d) => d.id);

  return (
    <div
      className={cn(
        'flex w-72 shrink-0 snap-start flex-col rounded-lg bg-muted/50',
        isOver && 'ring-2 ring-primary/30'
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {fase.nombre}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fase.deals.length === 1
              ? '1 oportunidad'
              : `${fase.deals.length} oportunidades`}{' '}
            &middot; {formatCurrency(totalValue)}
          </p>
        </div>
        {fase.tiempo_esperado && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {fase.tiempo_esperado}d
          </span>
        )}
      </div>

      {/* Deal cards */}
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 overflow-y-auto px-2 pb-2"
        style={{ minHeight: 80 }}
      >
        <SortableContext
          items={dealIds}
          strategy={verticalListSortingStrategy}
        >
          {fase.deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onClick={onDealClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
