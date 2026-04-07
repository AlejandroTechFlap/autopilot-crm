'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MutationState {
  loading: boolean;
  error: string | null;
}

export function useDealMutations() {
  const router = useRouter();
  const [state, setState] = useState<MutationState>({
    loading: false,
    error: null,
  });

  const moveDeal = useCallback(
    async (dealId: string, faseDestino: string) => {
      setState({ loading: true, error: null });
      try {
        const res = await fetch(`/api/deals/${dealId}/mover`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fase_destino: faseDestino }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'No se ha podido mover el negocio');
        }
        setState({ loading: false, error: null });
        // Invalidate RSC caches so cockpit/dashboard reflect the move
        // immediately on next navigation, without waiting for realtime.
        router.refresh();
        return true;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'No se ha podido mover el negocio';
        setState({ loading: false, error: msg });
        return false;
      }
    },
    [router]
  );

  const closeDeal = useCallback(
    async (
      dealId: string,
      resultado: 'ganado' | 'perdido',
      motivoPerdida?: string
    ) => {
      setState({ loading: true, error: null });
      try {
        const res = await fetch(`/api/deals/${dealId}/cerrar`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resultado, motivo_perdida: motivoPerdida }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'No se ha podido cerrar el negocio');
        }
        setState({ loading: false, error: null });
        router.refresh();
        return true;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'No se ha podido cerrar el negocio';
        setState({ loading: false, error: msg });
        return false;
      }
    },
    [router]
  );

  return { ...state, moveDeal, closeDeal };
}
