import { useCallback, useEffect, useState } from 'react';
import type { PersonalKpis } from '../types';

export function usePersonalKpis() {
  const [kpis, setKpis] = useState<PersonalKpis | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mis-kpis');
      if (res.ok) {
        const data = await res.json();
        setKpis(data.kpis);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { kpis, loading, refresh: load };
}
