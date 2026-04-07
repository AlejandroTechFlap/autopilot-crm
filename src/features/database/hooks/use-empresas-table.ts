import { useCallback, useEffect, useState } from 'react';

export interface EmpresaRow {
  id: string;
  nombre: string;
  lifecycle_stage: string;
  fuente_lead: string;
  prioridad: string | null;
  provincia: string | null;
  categoria: string | null;
  proxima_accion: string | null;
  proxima_accion_fecha: string | null;
  created_at: string;
  updated_at: string;
  vendedor: { id: string; nombre: string } | null;
}

export interface EmpresaFilters {
  search: string;
  lifecycle_stage: string;
  fuente_lead: string;
  prioridad: string;
  sort: string;
  order: 'asc' | 'desc';
  page: number;
}

const PAGE_SIZE = 25;

export function useEmpresasTable(filters: EmpresaFilters) {
  const [rows, setRows] = useState<EmpresaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Destructure primitives so the callback identity is stable when callers
  // pass a freshly-built `filters` object on every render. Depending on the
  // object reference caused an infinite refetch loop and a permanent
  // "Loading…" state on BBDD Empresas.
  const { search, lifecycle_stage, fuente_lead, prioridad, sort, order, page } = filters;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (lifecycle_stage) params.set('lifecycle_stage', lifecycle_stage);
    if (fuente_lead) params.set('fuente_lead', fuente_lead);
    if (prioridad) params.set('prioridad', prioridad);
    params.set('sort', sort);
    params.set('order', order);
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String(page * PAGE_SIZE));

    try {
      const res = await fetch(`/api/empresas?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.empresas ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [search, lifecycle_stage, fuente_lead, prioridad, sort, order, page]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  /**
   * Optimistically update a single row (e.g. after an inline-edit save).
   * Avoids a full reload and the associated flicker.
   */
  const updateRow = useCallback((id: string, patch: Partial<EmpresaRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  return {
    rows,
    total,
    loading,
    pageSize: PAGE_SIZE,
    refresh: load,
    updateRow,
  };
}
