import type { PipelineData } from '../types';

/**
 * Returns a new PipelineData with the given deal moved to the target phase.
 *
 * Pure and immutable: never mutates the input. The deal is appended to the
 * end of the target phase's deals array, and its `fase_actual` is updated.
 *
 * No-op (returns the original reference) if the deal is not found, or if it
 * already lives in the target phase. The caller can rely on referential
 * equality to detect this case.
 *
 * Used by `usePipeline.applyOptimisticMove` so the kanban board can react
 * in the same frame as the drop, before the API call resolves.
 */
export function moveDealOptimistic(
  data: PipelineData,
  dealId: string,
  targetFaseId: string,
): PipelineData {
  // Locate the source phase + the deal inside it.
  let sourceFaseIndex = -1;
  let dealIndex = -1;
  for (let i = 0; i < data.fases.length; i++) {
    const idx = data.fases[i].deals.findIndex((d) => d.id === dealId);
    if (idx !== -1) {
      sourceFaseIndex = i;
      dealIndex = idx;
      break;
    }
  }

  if (sourceFaseIndex === -1 || dealIndex === -1) return data;

  const sourceFase = data.fases[sourceFaseIndex];
  const deal = sourceFase.deals[dealIndex];

  // Already in the target — nothing to do.
  if (deal.fase_actual === targetFaseId) return data;

  const targetFaseIndex = data.fases.findIndex((f) => f.id === targetFaseId);
  if (targetFaseIndex === -1) return data;

  const movedDeal = { ...deal, fase_actual: targetFaseId };

  const newFases = data.fases.map((fase, i) => {
    if (i === sourceFaseIndex) {
      return {
        ...fase,
        deals: fase.deals.filter((_, j) => j !== dealIndex),
      };
    }
    if (i === targetFaseIndex) {
      return {
        ...fase,
        deals: [...fase.deals, movedDeal],
      };
    }
    return fase;
  });

  return { ...data, fases: newFases };
}
