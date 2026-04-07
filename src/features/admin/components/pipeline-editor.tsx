'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Fase {
  id: string;
  nombre: string;
  orden: number;
  tiempo_esperado: number | null;
  criterios_entrada: Record<string, unknown>;
}

interface Pipeline {
  id: string;
  nombre: string;
  fases: Fase[];
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `HTTP ${res.status}`;
}

export function PipelineEditor() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pipelines');
      if (!res.ok) throw new Error(await readError(res));
      const body = (await res.json()) as { pipelines: Pipeline[] };
      const list = body.pipelines ?? [];
      setPipelines(list);
      setSelectedId((prev) => prev ?? list[0]?.id ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se han podido cargar los pipelines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = pipelines.find((p) => p.id === selectedId) ?? null;

  const createPipeline = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const nombre = (
        new FormData(e.currentTarget).get('nombre') as string
      )?.trim();
      if (!nombre) return;
      setCreating(true);
      try {
        const res = await fetch('/api/admin/pipelines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre }),
        });
        if (!res.ok) throw new Error(await readError(res));
        toast.success('Pipeline creado');
        setShowCreate(false);
        await load();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'No se ha podido crear el pipeline');
      } finally {
        setCreating(false);
      }
    },
    [load, router]
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando pipelines...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[240px]">
          <Select
            value={selectedId ?? undefined}
            onValueChange={(v) => setSelectedId(v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          className="gap-1.5"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4" /> Nuevo pipeline
        </Button>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Nuevo pipeline</DialogTitle>
            </DialogHeader>
            <form onSubmit={createPipeline} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="np-nombre">Nombre</Label>
                <Input id="np-nombre" name="nombre" required maxLength={120} />
              </div>
              <p className="text-xs text-muted-foreground">
                Se crearán automáticamente dos fases (Inicio y Cerrado).
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creando...' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {selected ? (
        <PhaseList pipeline={selected} onChange={load} />
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Aún no hay pipelines. Pulsa «Nuevo pipeline» para crear uno.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PhaseListProps {
  pipeline: Pipeline;
  onChange: () => Promise<void> | void;
}

function PhaseList({ pipeline, onChange }: PhaseListProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const addPhase = useCallback(async () => {
    setAdding(true);
    try {
      const maxOrden = Math.max(...pipeline.fases.map((f) => f.orden), 0);
      const res = await fetch('/api/admin/fases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_id: pipeline.id,
          nombre: 'Nueva fase',
          orden: maxOrden + 1,
          tiempo_esperado: 1,
        }),
      });
      if (!res.ok) throw new Error(await readError(res));
      toast.success('Fase añadida');
      await onChange();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se ha podido añadir la fase');
    } finally {
      setAdding(false);
    }
  }, [pipeline, onChange, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fases — {pipeline.nombre}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pipeline.fases.length === 0 && (
          <p className="text-sm text-muted-foreground">Aún no hay fases.</p>
        )}
        {pipeline.fases.map((fase) => (
          <PhaseRow key={fase.id} fase={fase} onChange={onChange} />
        ))}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addPhase}
            disabled={adding}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" /> {adding ? 'Añadiendo...' : 'Añadir fase'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface PhaseRowProps {
  fase: Fase;
  onChange: () => Promise<void> | void;
}

function PhaseRow({ fase, onChange }: PhaseRowProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState(fase.nombre);
  const [tiempo, setTiempo] = useState<string>(
    fase.tiempo_esperado?.toString() ?? ''
  );
  const [busy, setBusy] = useState(false);

  const dirty =
    nombre !== fase.nombre ||
    tiempo !== (fase.tiempo_esperado?.toString() ?? '');

  const save = useCallback(async () => {
    setBusy(true);
    try {
      const tiempoNum = tiempo === '' ? null : Number(tiempo);
      if (tiempo !== '' && Number.isNaN(tiempoNum)) {
        throw new Error('Los días deben ser un número');
      }
      const res = await fetch(`/api/admin/fases/${fase.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, tiempo_esperado: tiempoNum }),
      });
      if (!res.ok) throw new Error(await readError(res));
      toast.success('Fase guardada');
      await onChange();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se ha podido guardar la fase');
    } finally {
      setBusy(false);
    }
  }, [fase.id, nombre, tiempo, onChange, router]);

  const remove = useCallback(async () => {
    if (!window.confirm(`¿Eliminar la fase "${fase.nombre}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/fases/${fase.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await readError(res));
      toast.success('Fase eliminada');
      await onChange();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se ha podido eliminar la fase');
    } finally {
      setBusy(false);
    }
  }, [fase.id, fase.nombre, onChange, router]);

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border bg-card px-3 py-2">
      <div className="w-10 pb-2 text-xs text-muted-foreground">#{fase.orden}</div>
      <div className="min-w-[180px] flex-1 space-y-1">
        <Label className="text-xs text-muted-foreground">Nombre</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </div>
      <div className="w-24 space-y-1">
        <Label className="text-xs text-muted-foreground">Días</Label>
        <Input
          type="number"
          min={0}
          value={tiempo}
          onChange={(e) => setTiempo(e.target.value)}
          placeholder="—"
        />
      </div>
      <div className="flex gap-1">
        <Button size="sm" onClick={save} disabled={!dirty || busy}>
          Guardar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={remove}
          disabled={busy}
          aria-label="Eliminar fase"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
