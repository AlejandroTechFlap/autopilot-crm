'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Download, Search, Star } from 'lucide-react';
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
import { formatDate } from '@/lib/formatting';
import { SortableHeader } from './sortable-header';
import { Pagination } from './pagination';
import { InlineEditCell } from './inline-edit-cell';
import { useContactosTable } from '../hooks/use-contactos-table';
import type { ContactoFilters, ContactoRow } from '../hooks/use-contactos-table';
import { useDebounce } from '@/hooks/useDebounce';

export function ContactosTableView() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState('nombre_completo');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filters: ContactoFilters = {
    search: debouncedSearch,
    sort,
    order,
    page,
  };

  const { rows, total, loading, pageSize, updateRow } = useContactosTable(filters);

  const patchRow = useCallback(
    async (id: string, patch: Partial<ContactoRow>) => {
      const res = await fetch(`/api/contactos/${id}`, {
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
    window.open(`/api/contactos/export?${params}`, '_blank');
  }, [debouncedSearch]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar contactos..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
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
                <SortableHeader label="Nombre" column="nombre_completo" currentSort={sort} currentOrder={order} onSort={handleSort} />
                <SortableHeader label="Cargo" column="cargo" currentSort={sort} currentOrder={order} onSort={handleSort} />
                <SortableHeader label="Email" column="email" currentSort={sort} currentOrder={order} onSort={handleSort} />
                <SortableHeader label="Teléfono" column="telefono" currentSort={sort} currentOrder={order} onSort={handleSort} />
                <SortableHeader label="Empresa" column="empresa" currentSort={sort} currentOrder={order} onSort={handleSort} />
                <SortableHeader label="Creado" column="created_at" currentSort={sort} currentOrder={order} onSort={handleSort} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No se han encontrado contactos.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{c.nombre_completo}</span>
                        {c.es_principal && (
                          <Badge variant="secondary" className="gap-0.5 text-[10px]">
                            <Star className="h-2.5 w-2.5" />
                            Principal
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <InlineEditCell
                        value={c.cargo}
                        onSave={(next) => patchRow(c.id, { cargo: next })}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      <InlineEditCell
                        value={c.email}
                        onSave={(next) => patchRow(c.id, { email: next })}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      <InlineEditCell
                        value={c.telefono}
                        onSave={(next) => patchRow(c.id, { telefono: next })}
                      />
                    </TableCell>
                    <TableCell>
                      {c.empresa ? (
                        <Link href={`/empresa/${c.empresa.id}`} className="text-sm hover:underline">
                          {c.empresa.nombre}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.created_at)}
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
