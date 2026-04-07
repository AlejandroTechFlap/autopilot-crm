'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FUENTE_LABELS, CATEGORIA_LABELS } from '@/lib/constants';

interface CreateLeadModalProps {
  pipelineId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called after a lead has been successfully created. The parent
   * `PipelineClient` passes the `usePipeline` `refresh` callback so the
   * kanban board's client state updates without waiting on Supabase
   * realtime or a manual page refresh.
   */
  onCreated?: () => void;
  /**
   * Vendedores the creator can assign the new lead to. The modal forces an
   * explicit pick — there is no implicit self-assignment, see
   * `docs/phase-2-pipeline-company.md` → "Lead creation — role gating".
   */
  vendedores: { id: string; nombre: string }[];
}

interface FaseOption {
  id: string;
  nombre: string;
  orden: number;
}

export function CreateLeadModal({
  pipelineId,
  open,
  onOpenChange,
  onCreated,
  vendedores,
}: CreateLeadModalProps) {
  const router = useRouter();
  const [fases, setFases] = useState<FaseOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [vendedorAsignado, setVendedorAsignado] = useState<string>('');

  // Reset the assignee when the modal closes so the next open starts fresh.
  useEffect(() => {
    if (!open) setVendedorAsignado('');
  }, [open]);

  // Fetch phases for the pipeline
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`/api/pipeline/${pipelineId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data.fases) {
          setFases(
            data.fases.map((f: FaseOption) => ({
              id: f.id,
              nombre: f.nombre,
              orden: f.orden,
            }))
          );
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('No se han podido cargar las fases');
      });
    return () => {
      cancelled = true;
    };
  }, [open, pipelineId]);

  const firstFaseId = fases.length > 0 ? fases[0].id : '';

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!vendedorAsignado) {
        toast.error('Debes asignar el lead a un vendedor');
        return;
      }

      setSubmitting(true);

      const form = new FormData(e.currentTarget);

      const payload = {
        empresa: {
          nombre: form.get('empresa_nombre') as string,
          fuente_lead: form.get('fuente_lead') as string,
          provincia: (form.get('provincia') as string) || undefined,
          categoria: (form.get('categoria') as string) || undefined,
        },
        contacto: {
          nombre_completo: form.get('contacto_nombre') as string,
          cargo: (form.get('cargo') as string) || undefined,
          telefono: (form.get('telefono') as string) || undefined,
          email: (form.get('email') as string) || undefined,
        },
        deal: {
          pipeline_id: pipelineId,
          fase_actual: (form.get('fase_actual') as string) || firstFaseId,
          valor: Number(form.get('valor') || 0),
          vendedor_asignado: vendedorAsignado,
        },
      };

      try {
        const res = await fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'No se ha podido crear el lead');
        }

        toast.success('Lead creado correctamente');
        onOpenChange(false);
        // Refetch the parent's client state (single source of truth) so the
        // new card shows up in the kanban immediately. router.refresh() still
        // helps any RSC pages that show counts/aggregates.
        onCreated?.();
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'No se ha podido crear el lead'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [pipelineId, firstFaseId, onOpenChange, onCreated, router, vendedorAsignado]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company section */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Empresa</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="empresa_nombre">Nombre *</Label>
                <Input id="empresa_nombre" name="empresa_nombre" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fuente_lead">Fuente *</Label>
                <Select name="fuente_lead" defaultValue="otro">
                  <SelectTrigger id="fuente_lead">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FUENTE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="provincia">Provincia</Label>
                <Input id="provincia" name="provincia" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="categoria">Categoría</Label>
                <Select name="categoria">
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </fieldset>

          {/* Contact section */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Contacto</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="contacto_nombre">Nombre completo *</Label>
                <Input id="contacto_nombre" name="contacto_nombre" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cargo">Cargo</Label>
                <Input id="cargo" name="cargo" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input id="telefono" name="telefono" type="tel" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
            </div>
          </fieldset>

          {/* Deal section */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Oportunidad</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fase_actual">Fase</Label>
                <Select name="fase_actual" defaultValue={firstFaseId}>
                  <SelectTrigger id="fase_actual">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fases.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="valor">Valor (EUR)</Label>
                <Input id="valor" name="valor" type="number" min="0" defaultValue="0" />
              </div>
            </div>
          </fieldset>

          {/* Assignment section — required pick, no implicit self-assignment. */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Asignación</legend>
            <div className="space-y-1">
              <Label htmlFor="vendedor_asignado">Vendedor asignado *</Label>
              <Select
                value={vendedorAsignado}
                onValueChange={(v) => setVendedorAsignado(v ?? '')}
              >
                <SelectTrigger id="vendedor_asignado">
                  <SelectValue placeholder="Selecciona un vendedor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendedores.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
