'use client';

import { startTransition, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/formatting';
import type { DrillData, DrillType, Periodo } from '../types';

interface KpiDrillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: DrillType | null;
  periodo: Periodo;
}

export function KpiDrillDialog({
  open,
  onOpenChange,
  tipo,
  periodo,
}: KpiDrillDialogProps) {
  const [data, setData] = useState<DrillData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !tipo) return;
    startTransition(() => {
      setData(null);
      setLoading(true);
      setError(null);
    });
    fetch(`/api/dashboard/drill/${tipo}?periodo=${periodo}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: DrillData) => startTransition(() => setData(json)))
      .catch((e: unknown) => {
        startTransition(() =>
          setError(e instanceof Error ? e.message : 'No se pudo cargar el detalle')
        );
      })
      .finally(() => startTransition(() => setLoading(false)));
  }, [open, tipo, periodo]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.title ?? 'Detalle del KPI'}</DialogTitle>
          <DialogDescription>
            Desglose para el periodo seleccionado.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <p className="text-sm text-muted-foreground">Cargando detalle...</p>
        )}
        {error && !loading && (
          <p className="text-sm text-danger">{error}</p>
        )}
        {data && !loading && !error && (
          <div className="space-y-5">
            <DrillSummary stats={data.summary} />
            {data.by_vendedor.length > 0 && (
              <DrillVendedorBreakdown rows={data.by_vendedor} />
            )}
            {data.items.length > 0 ? (
              <DrillItemList items={data.items} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay elementos para mostrar en este periodo.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DrillSummary({ stats }: { stats: DrillData['summary'] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-md border border-border bg-muted/30 px-4 py-3"
        >
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="mt-1 text-lg font-semibold">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function DrillVendedorBreakdown({
  rows,
}: {
  rows: DrillData['by_vendedor'];
}) {
  const hasValor = rows.some((r) => typeof r.valor === 'number');
  const hasRate = rows.some((r) => typeof r.rate === 'number');

  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Por vendedor
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendedor</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            {hasValor && <TableHead className="text-right">Valor</TableHead>}
            {hasRate && <TableHead className="text-right">Tasa de éxito</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.vendedor_id}>
              <TableCell className="font-medium">{r.vendedor}</TableCell>
              <TableCell className="text-right">{r.count}</TableCell>
              {hasValor && (
                <TableCell className="text-right">
                  {typeof r.valor === 'number' ? formatCurrency(r.valor) : '—'}
                </TableCell>
              )}
              {hasRate && (
                <TableCell className="text-right">
                  {typeof r.rate === 'number' ? `${r.rate}%` : '—'}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function DrillItemList({ items }: { items: DrillData['items'] }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Principales elementos
      </h3>
      <ul className="divide-y divide-border rounded-md border border-border">
        {items.map((item) => {
          const body = (
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.primary}</p>
                {item.secondary && (
                  <p className="truncate text-xs text-muted-foreground">
                    {item.secondary}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                {typeof item.valor === 'number' && (
                  <p className="text-sm font-semibold">
                    {formatCurrency(item.valor)}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {item.vendedor && <span>{item.vendedor}</span>}
                  {item.date && <span>{formatDate(item.date)}</span>}
                </div>
              </div>
            </div>
          );
          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="block transition-colors hover:bg-muted/50"
                >
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
