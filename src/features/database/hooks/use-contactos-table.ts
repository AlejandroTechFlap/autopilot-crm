import { useCallback, useEffect, useState } from 'react';

export interface ContactoRow {
  id: string;
  nombre_completo: string;
  cargo: string | null;
  telefono: string | null;
  email: string | null;
  es_principal: boolean;
  created_at: string;
  empresa: { id: string; nombre: string } | null;
}

export interface ContactoFilters {
  search: string;
  sort: string;
  order: 'asc' | 'desc';
  page: number;
}

const PAGE_SIZE = 25;

export function useContactosTable(filters: ContactoFilters) {
  const [rows, setRows] = useState<ContactoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Destructure primitives so the callback identity is stable when callers
  // pass a freshly-built `filters` object on every render. Depending on the
  // object reference caused an infinite refetch loop and a permanent
  // "Loading…" state on BBDD Contactos.
  const { search, sort, order, page } = filters;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('sort', sort);
    params.set('order', order);
    params.set('limit', String(PAGE_SIZE));
    params.set('offset', String(page * PAGE_SIZE));

    try {
      const res = await fetch(`/api/contactos?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.contactos ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [search, sort, order, page]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const updateRow = useCallback((id: string, patch: Partial<ContactoRow>) => {
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
