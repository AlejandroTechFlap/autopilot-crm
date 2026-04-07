import { useCallback, useEffect, useState } from 'react';
import type { DashboardData, ChartPoint, Periodo, ChartType } from '../types';

export function useDashboardKpis(periodo: Periodo) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/kpis?periodo=${periodo}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, refresh: load };
}

export function useChartData(tipo: ChartType, periodo: Periodo) {
  const [series, setSeries] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/historico?tipo=${tipo}&periodo=${periodo}`)
      .then((r) => r.json())
      .then((d) => setSeries(d.series ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tipo, periodo]);

  return { series, loading };
}
