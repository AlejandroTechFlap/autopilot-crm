'use client';

import { useState } from 'react';
import { KanbanBoard } from '@/features/pipeline/components/kanban-board';
import { CreateLeadModal } from '@/features/pipeline/components/create-lead-modal';
import { usePipeline } from '@/features/pipeline/hooks/use-pipeline';

interface PipelineClientProps {
  pipelineId: string;
  /** True only for admin/direccion. Vendedores never see the create-lead UI. */
  canCreateLead: boolean;
  /** List of vendedores for the create-lead assignment dropdown. Empty for vendedores. */
  vendedores: { id: string; nombre: string }[];
}

export function PipelineClient({
  pipelineId,
  canCreateLead,
  vendedores,
}: PipelineClientProps) {
  const [showCreateLead, setShowCreateLead] = useState(false);

  // Single source of truth for pipeline data — shared by the kanban board
  // and the create-lead modal so both stay in sync after mutations without
  // relying on Supabase realtime firing.
  const { data, loading, error, refresh, applyOptimisticMove } =
    usePipeline(pipelineId);

  return (
    <div className="h-full">
      <KanbanBoard
        data={data}
        loading={loading}
        error={error}
        refresh={refresh}
        applyOptimisticMove={applyOptimisticMove}
        canCreateLead={canCreateLead}
        onCreateLead={() => setShowCreateLead(true)}
      />
      {canCreateLead && (
        <CreateLeadModal
          pipelineId={pipelineId}
          open={showCreateLead}
          onOpenChange={setShowCreateLead}
          onCreated={refresh}
          vendedores={vendedores}
        />
      )}
    </div>
  );
}
