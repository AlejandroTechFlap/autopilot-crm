'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDealMutations } from '../hooks/use-deal-mutations';
import { KanbanColumn } from './kanban-column';
import { DealCard } from './deal-card';
import { PipelineFilters } from './pipeline-filters';
import type { PipelineData, PipelineDeal, PipelineFase } from '../types';

interface KanbanBoardProps {
  data: PipelineData | null;
  loading: boolean;
  error: string | null;
  applyOptimisticMove: (dealId: string, targetFaseId: string) => () => void;
  /** Hide the "Nuevo lead" button for vendedores. */
  canCreateLead: boolean;
  onCreateLead: () => void;
}

export function KanbanBoard({
  data,
  loading,
  error,
  applyOptimisticMove,
  canCreateLead,
  onCreateLead,
}: KanbanBoardProps) {
  const { moveDeal } = useDealMutations();
  const router = useRouter();

  const [activeDeal, setActiveDeal] = useState<PipelineDeal | null>(null);
  const [vendedorFilter, setVendedorFilter] = useState('all');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Extract unique vendedores
  const vendedores = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { id: string; nombre: string }>();
    for (const fase of data.fases) {
      for (const deal of fase.deals) {
        if (!map.has(deal.vendedor.id)) {
          map.set(deal.vendedor.id, deal.vendedor);
        }
      }
    }
    return Array.from(map.values());
  }, [data]);

  // Filter phases by vendedor + value range
  const filteredFases: PipelineFase[] = useMemo(() => {
    if (!data) return [];

    const min = minValue ? Number(minValue) : null;
    const max = maxValue ? Number(maxValue) : null;
    const hasFilters =
      vendedorFilter !== 'all' || min !== null || max !== null;

    if (!hasFilters) return data.fases;

    return data.fases.map((fase) => ({
      ...fase,
      deals: fase.deals.filter((d) => {
        if (vendedorFilter !== 'all' && d.vendedor.id !== vendedorFilter) {
          return false;
        }
        if (min !== null && d.valor < min) return false;
        if (max !== null && d.valor > max) return false;
        return true;
      }),
    }));
  }, [data, vendedorFilter, minValue, maxValue]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const deal = event.active.data.current?.deal as PipelineDeal | undefined;
      if (deal) setActiveDeal(deal);
    },
    []
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveDeal(null);
      const { active, over } = event;
      if (!over) return;

      const deal = active.data.current?.deal as PipelineDeal | undefined;
      if (!deal) return;

      // Determine target phase
      let targetFaseId: string | null = null;

      if (over.data.current?.type === 'column') {
        targetFaseId = over.data.current.faseId as string;
      } else if (over.data.current?.type === 'deal') {
        // Dropped on another deal — find its phase
        const targetDeal = over.data.current.deal as PipelineDeal;
        targetFaseId = targetDeal.fase_actual;
      }

      if (!targetFaseId || targetFaseId === deal.fase_actual) return;

      // Optimistic update — the card lands in the target column in the same
      // frame as the drop. The API call runs in the background; on failure
      // we call revert() to snap the card back. Realtime acts as the
      // eventual-consistency safety net, so we deliberately do NOT call
      // refresh() on success (that's what was making the UI feel slow).
      const revert = applyOptimisticMove(deal.id, targetFaseId);

      const success = await moveDeal(deal.id, targetFaseId);
      if (success) {
        toast.success('Oportunidad movida correctamente');
      } else {
        revert();
        toast.error('No se ha podido mover la oportunidad');
      }
    },
    [moveDeal, applyOptimisticMove]
  );

  const handleDealClick = useCallback(
    (deal: PipelineDeal) => {
      router.push(`/empresa/${deal.empresa.id}`);
    },
    [router]
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">{data.pipeline.nombre}</h2>
          <PipelineFilters
            vendedores={vendedores}
            selectedVendedor={vendedorFilter}
            onVendedorChange={setVendedorFilter}
            minValue={minValue}
            maxValue={maxValue}
            onMinValueChange={setMinValue}
            onMaxValueChange={setMaxValue}
          />
        </div>
        {canCreateLead && (
          <Button size="sm" onClick={onCreateLead}>
            <Plus className="mr-1 h-4 w-4" />
            Nuevo lead
          </Button>
        )}
      </div>

      {/* Kanban columns */}
      <div className="flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto pb-4 sm:snap-none">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {filteredFases.map((fase) => (
            <KanbanColumn
              key={fase.id}
              fase={fase}
              onDealClick={handleDealClick}
            />
          ))}

          <DragOverlay>
            {activeDeal ? (
              <div className="w-72">
                <DealCard deal={activeDeal} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
