'use client';

/**
 * Phase 10 — /admin/campos definitions manager.
 *
 * Three-view layout (one per entity) sharing a single loaded list. Handles
 * list render + delete; create/edit is delegated to `<CampoDialog>`.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CampoPersonalizado, Entidad } from '@/features/tenant/types';
import { ENTIDADES, ENTIDAD_LABELS, TIPO_LABELS } from './campos-copy';
import { CampoDialog } from './campo-dialog';

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `HTTP ${res.status}`;
}

export function CamposManager() {
  const router = useRouter();
  const [campos, setCampos] = useState<CampoPersonalizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Entidad>('empresa');
  const [editing, setEditing] = useState<CampoPersonalizado | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/campos');
      if (!res.ok) throw new Error(await readError(res));
      const body = (await res.json()) as { campos: CampoPersonalizado[] };
      setCampos(body.campos ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No se han podido cargar los campos'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(
    () => campos.filter((c) => c.entidad === selected),
    [campos, selected]
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((c: CampoPersonalizado) => {
    setEditing(c);
    setShowForm(true);
  }, []);

  const remove = useCallback(
    async (c: CampoPersonalizado) => {
      const warn =
        `¿Eliminar el campo "${c.etiqueta}" de ${ENTIDAD_LABELS[c.entidad]}?\n\n` +
        'Se eliminarán los valores guardados de este campo en todos los registros. ' +
        'Esta acción no se puede deshacer.';
      if (!window.confirm(warn)) return;
      try {
        const res = await fetch(`/api/admin/campos/${c.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(await readError(res));
        const body = (await res.json()) as { rowsStripped?: number };
        const count = body.rowsStripped ?? 0;
        toast.success(
          count > 0
            ? `Campo eliminado (${count} ${count === 1 ? 'registro afectado' : 'registros afectados'})`
            : 'Campo eliminado'
        );
        await load();
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'No se ha podido eliminar el campo'
        );
      }
    },
    [load, router]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando campos...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
          {ENTIDADES.map((e) => (
            <Button
              key={e}
              size="sm"
              variant={selected === e ? 'default' : 'ghost'}
              onClick={() => setSelected(e)}
              className={cn(
                'h-7 px-3 text-xs',
                selected !== e && 'hover:bg-background'
              )}
            >
              {ENTIDAD_LABELS[e]}
            </Button>
          ))}
        </div>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuevo campo
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {visible.length} {visible.length === 1 ? 'campo' : 'campos'} en{' '}
        {ENTIDAD_LABELS[selected]}
      </p>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay campos personalizados para {ENTIDAD_LABELS[selected]}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {visible.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{c.etiqueta}</h3>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {c.clave}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {TIPO_LABELS[c.tipo]}
                    </Badge>
                    {c.obligatorio && (
                      <Badge className="text-[10px]">Obligatorio</Badge>
                    )}
                    {c.tipo === 'seleccion' && c.opciones && (
                      <span className="text-xs text-muted-foreground">
                        {c.opciones.length}{' '}
                        {c.opciones.length === 1 ? 'opción' : 'opciones'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(c)}
                    aria-label="Editar campo"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(c)}
                    aria-label="Eliminar campo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CampoDialog
        open={showForm}
        onOpenChange={setShowForm}
        editing={editing}
        defaultEntidad={selected}
        onSaved={load}
      />
    </div>
  );
}
