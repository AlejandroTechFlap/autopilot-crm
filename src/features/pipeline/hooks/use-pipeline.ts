'use client';

import { useCallback, useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser-singleton';
import { moveDealOptimistic } from '../lib/optimistic-moves';
import type { PipelineData } from '../types';

interface UsePipelineResult {
  data: PipelineData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /**
   * Apply an optimistic phase move to local state. Returns a `revert`
   * closure that restores the previous snapshot — call it from the
   * caller's failure branch when the API mutation rejects.
   */
  applyOptimisticMove: (dealId: string, targetFaseId: string) => () => void;
}

export function usePipeline(pipelineId: string): UsePipelineResult {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch(`/api/pipeline/${pipelineId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline');
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  // Initial + manual fetch. Re-runs only when the pipelineId itself changes
  // (fetchPipeline is memoised on pipelineId, so its identity is stable).
  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // Realtime subscription for deal changes. Kept in its own effect with
  // [pipelineId] deps so the channel is created once per pipeline, not on
  // every render. Channel name is unique per pipeline to avoid collisions
  // when the component is mounted twice (e.g. modal + page).
  useEffect(() => {
    const supabase = getBrowserClient();
    const channel = supabase
      .channel(`pipeline-deals-${pipelineId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `pipeline_id=eq.${pipelineId}`,
        },
        () => {
          fetchPipeline();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pipelineId]);

  // Optimistic phase move: snapshot the current state, apply the move
  // synchronously via a pure helper, and return a closure that restores
  // the snapshot. Using the functional form of setData lets us capture
  // the latest state without re-creating the callback when data changes.
  const applyOptimisticMove = useCallback(
    (dealId: string, targetFaseId: string) => {
      let snapshot: PipelineData | null = null;
      setData((prev) => {
        snapshot = prev;
        return prev ? moveDealOptimistic(prev, dealId, targetFaseId) : prev;
      });
      return () => {
        setData(snapshot);
      };
    },
    [],
  );

  return {
    data,
    loading,
    error,
    refresh: fetchPipeline,
    applyOptimisticMove,
  };
}
