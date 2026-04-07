'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Download, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LIFECYCLE_LABELS,
  LIFECYCLE_COLORS,
  FUENTE_LABELS,
  PRIORIDAD_LABELS,
  PRIORIDAD_COLORS,
} from '@/lib/constants';
import { formatDate } from '@/lib/formatting';
import { SortableHeader } from './sortable-header';
import { Pagination } from './pagination';
import { InlineEditCell } from './inline-edit-cell';
import { useEmpresasTable } from '../hooks/use-empresas-table';
import type { EmpresaFilters, EmpresaRow } from '../hooks/use-empresas-table';
import { useDebounce } from '@/hooks/useDebounce';

function handleFilterChange(
  setter: (val: string) => void
): (value: string | null) => void {
  return (value) => setter(value ?? '');
}

export function EmpresasTableView() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [lifecycleStage, setLifecycleStage] = useState('');
  const [fuenteLead, setFuenteLead] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [sort, setSort] = useState('updated_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);

  const filters: EmpresaFilters = {
    search: debouncedSearch,
    lifecycle_stage: lifecycleStage,
    fuente_lead: fuenteLead,
    prioridad,
    sort,
    order,
    page,
  };

  const { rows, total, loading, pageSize, updateRow } = useEmpresasTable(filters);

  const patchRow = useCallback(
    async (id: string, patch: Partial<EmpresaRow>) => {
      const res = await fetch(`/api/empresas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'No se ha podido guardar');
      }
      updateRow(id, patch);
    },
    [updateRow]
  );

  const handleSort = useCallback((col: string) => {
    setSort((prev) => {
      if (prev === col) {
        setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return col;
      }
      setOrder('asc');
      return col;
    });
    setPage(0);
  }, []);

  const exportCsv = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (lifecycleStage) params.set('lifecycle_stage', lifecycleStage);
    if (fuenteLead) params.set('fuente_lead', fuenteLead);
    if (prioridad) params.set('prioridad', prioridad);
    window.open(`/api/empresas/export?${params}`, '_blank');
  }, [debouncedSearch, lifecycleStage, fuenteLead, prioridad]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar empresas..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={lifecycleStage || 'all'} onValueChange={handleFilterChange((v) => { setLifecycleStage(v === 'all' ? '' : v); setPage(0); })}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etapas</SelectItem>
            {Object.entries(LIFECYCLE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fuenteLead || 'all'} onValueChange={handleFilterChange((v) => { setFuenteLead(v === 'all' ? '' : v); setPage(0); })}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Origen" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los orígenes</SelectItem>
            {Object.entries(FUENTE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={prioridad || 'all'} onValueChange={handleFilterChange((v) => { setPrioridad(v === 'all' ? '' : v); setPage(0); })}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Prioridad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las prioridades</SelectItem>
            {Object.entries(PRIORIDAD_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          CSV
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader label="Nombre" column="nombre" currentSort={sort} currentOrder={order} onSort={handleSort} />
                <SortableHeader label="Etapa" column="lifecycle_stage" currentSort={sort} currentOrder={order} onSort={handleSort} />
                <SortableHeader label="Origen" column="fuente_lead" currentSort={sort} currentOrder={order} onSort={handleSort} />
                <SortableHeader label="Prioridad" column="prioridad" currentSort={sort} currentOrder={order} onSort={handleSort} />
                <SortableHeader label="Provincia" column="provincia" currentSort={sort} currentOrder={order} onSort={handleSort} />
                <SortableHeader label="Actualizado" column="updated_at" currentSort={sort} currentOrder={order} onSort={handleSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No se han encontrado empresas.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Link href={`/empresa/${e.id}`} className="font-medium hover:underline">
                        {e.nombre}
                      </Link>
                      {e.vendedor && (
                        <p className="text-xs text-muted-foreground">{e.vendedor.nombre}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] ${LIFECYCLE_COLORS[e.lifecycle_stage as keyof typeof LIFECYCLE_COLORS] ?? ''}`}>
                        {LIFECYCLE_LABELS[e.lifecycle_stage as keyof typeof LIFECYCLE_LABELS] ?? e.lifecycle_stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {FUENTE_LABELS[e.fuente_lead as keyof typeof FUENTE_LABELS] ?? e.fuente_lead}
                    </TableCell>
                    <TableCell>
                      {e.prioridad ? (
                        <Badge variant="secondary" className={`text-[10px] ${PRIORIDAD_COLORS[e.prioridad as keyof typeof PRIORIDAD_COLORS] ?? ''}`}>
                          {PRIORIDAD_LABELS[e.prioridad as keyof typeof PRIORIDAD_LABELS] ?? e.prioridad}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <InlineEditCell
                        value={e.provincia}
                        onSave={(next) => patchRow(e.id, { provincia: next })}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(e.updated_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
