'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Script {
  id: string;
  titulo: string;
  contenido: string;
  tags: string[] | null;
  fase_asociada: string | null;
  fase: { id: string; nombre: string } | null;
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `HTTP ${res.status}`;
}

export function ScriptManager() {
  const router = useRouter();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Script | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/scripts');
      if (!res.ok) throw new Error(await readError(res));
      const body = (await res.json()) as { scripts: Script[] };
      setScripts(body.scripts ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se han podido cargar los scripts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setShowForm(true);
  }, []);

  const openEdit = useCallback((script: Script) => {
    setEditing(script);
    setShowForm(true);
  }, []);

  const remove = useCallback(
    async (script: Script) => {
      if (!window.confirm(`¿Eliminar el script "${script.titulo}"?`)) return;
      try {
        const res = await fetch(`/api/admin/scripts/${script.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(await readError(res));
        toast.success('Script eliminado');
        await load();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se ha podido eliminar el script');
      }
    },
    [load, router]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando scripts...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {scripts.length} {scripts.length === 1 ? 'script' : 'scripts'}
        </p>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuevo script
        </Button>
      </div>

      {scripts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay scripts. Crea uno para ayudar a los vendedores.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {scripts.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{s.titulo}</h3>
                    {s.fase && (
                      <Badge variant="outline">{s.fase.nombre}</Badge>
                    )}
                    {s.tags?.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {s.contenido}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(s)}
                    aria-label="Editar script"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(s)}
                    aria-label="Eliminar script"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ScriptFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        script={editing}
        onSaved={load}
      />
    </div>
  );
}

interface ScriptFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  script: Script | null;
  onSaved: () => Promise<void> | void;
}

function ScriptFormDialog({
  open,
  onOpenChange,
  script,
  onSaved,
}: ScriptFormDialogProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const payload = {
        titulo: (form.get('titulo') as string).trim(),
        contenido: (form.get('contenido') as string).trim(),
        tags: (form.get('tags') as string)
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      setBusy(true);
      try {
        const url = script
          ? `/api/admin/scripts/${script.id}`
          : '/api/admin/scripts';
        const method = script ? 'PATCH' : 'POST';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await readError(res));
        toast.success(script ? 'Script actualizado' : 'Script creado');
        onOpenChange(false);
        await onSaved();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se ha podido guardar el script');
      } finally {
        setBusy(false);
      }
    },
    [script, onOpenChange, onSaved, router]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{script ? 'Editar script' : 'Nuevo script'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              name="titulo"
              required
              maxLength={200}
              defaultValue={script?.titulo ?? ''}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="contenido">Contenido</Label>
            <Textarea
              id="contenido"
              name="contenido"
              required
              rows={6}
              defaultValue={script?.contenido ?? ''}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
            <Input
              id="tags"
              name="tags"
              defaultValue={script?.tags?.join(', ') ?? ''}
              placeholder="objeciones, frio, descubrimiento"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
