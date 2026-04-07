'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Kpi {
  id: string;
  tipo: string;
  periodo: string | null;
  objetivo: number | null;
  umbral_verde: number | null;
  umbral_ambar: number | null;
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `HTTP ${res.status}`;
}

function toNum(v: string): number | null {
  if (v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function KpiThresholdsEditor() {
  const router = useRouter();
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/kpis');
      if (!res.ok) throw new Error(await readError(res));
      const body = (await res.json()) as { kpis: Kpi[] };
      setKpis(body.kpis ?? []);
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se han podido cargar los KPIs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback((id: string, patch: Partial<Kpi>) => {
    setKpis((prev) => prev.map((k) => (k.id === id ? { ...k, ...patch } : k)));
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/kpis', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kpis: kpis.map((k) => ({
            id: k.id,
            objetivo: k.objetivo,
            umbral_verde: k.umbral_verde,
            umbral_ambar: k.umbral_ambar,
          })),
        }),
      });
      if (!res.ok) throw new Error(await readError(res));
      toast.success('KPIs guardados');
      await load();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se han podido guardar los KPIs');
    } finally {
      setSaving(false);
    }
  }, [kpis, load, router]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando KPIs...
      </div>
    );
  }

  if (kpis.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No hay KPIs configurados.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI</TableHead>
                  <TableHead className="w-[110px]">Periodo</TableHead>
                  <TableHead className="w-[140px]">Objetivo</TableHead>
                  <TableHead className="w-[140px]">Verde ≥</TableHead>
                  <TableHead className="w-[140px]">Ámbar ≥</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.tipo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {k.periodo ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={k.objetivo ?? ''}
                        onChange={(e) =>
                          update(k.id, { objetivo: toNum(e.target.value) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={k.umbral_verde ?? ''}
                        onChange={(e) =>
                          update(k.id, { umbral_verde: toNum(e.target.value) })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={k.umbral_ambar ?? ''}
                        onChange={(e) =>
                          update(k.id, { umbral_ambar: toNum(e.target.value) })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={save} disabled={!dirty || saving}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}
