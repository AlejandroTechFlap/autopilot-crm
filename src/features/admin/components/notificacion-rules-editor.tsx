'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Canal = 'in_app' | 'email' | 'slack';

interface Rule {
  id: string;
  disparador_tipo: string;
  canal: Canal;
  umbral_horas: number | null;
  activo: boolean;
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `HTTP ${res.status}`;
}

export function NotificacionRulesEditor() {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notificaciones');
      if (!res.ok) throw new Error(await readError(res));
      const body = (await res.json()) as { reglas: Rule[] };
      setRules(body.reglas ?? []);
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se han podido cargar las reglas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback((id: string, patch: Partial<Rule>) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/notificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reglas: rules.map((r) => ({
            id: r.id,
            activo: r.activo,
            canal: r.canal,
            umbral_horas: r.umbral_horas,
          })),
        }),
      });
      if (!res.ok) throw new Error(await readError(res));
      toast.success('Reglas guardadas');
      await load();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se han podido guardar las reglas');
    } finally {
      setSaving(false);
    }
  }, [rules, load, router]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando reglas...
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No hay reglas de notificación configuradas.
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
                  <TableHead>Disparador</TableHead>
                  <TableHead className="w-[160px]">Canal</TableHead>
                  <TableHead className="w-[140px]">Umbral (h)</TableHead>
                  <TableHead className="w-[100px]">Activa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.disparador_tipo}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={r.canal}
                        onValueChange={(v) => update(r.id, { canal: v as Canal })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_app">In-app</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="slack">Slack</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={r.umbral_horas ?? ''}
                        placeholder="—"
                        onChange={(e) => {
                          const v = e.target.value;
                          update(r.id, {
                            umbral_horas: v === '' ? null : Number(v),
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={r.activo}
                        onCheckedChange={(v) => update(r.id, { activo: v })}
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
