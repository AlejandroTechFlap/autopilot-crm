import { useEffect, useState } from 'react';

export interface TeamKpis {
  total_pipeline_value: number;
  deals_abiertos: number;
  deals_ganados: number;
  deals_perdidos: number;
  tasa_conversion: number;
  valor_ganado: number;
  ticket_medio: number;
  actividades_periodo: number;
  tareas_vencidas: number;
}

export interface TeamKpisDelta {
  deals_ganados: number;
  valor_ganado: number;
  tasa_conversion: number;
  ticket_medio: number;
}

interface UseTeamKpisResult {
  kpis: TeamKpis | null;
  prevKpis: TeamKpisDelta | null;
  loading: boolean;
  error: string | null;
}

export function useTeamKpis(): UseTeamKpisResult {
  const [kpis, setKpis] = useState<TeamKpis | null>(null);
  const [prevKpis, setPrevKpis] = useState<TeamKpisDelta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard/kpis?periodo=month');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setKpis(data.kpis);
        setPrevKpis(data.prev_kpis);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { kpis, prevKpis, loading, error };
}
