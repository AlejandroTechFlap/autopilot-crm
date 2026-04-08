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
import { LeadFormFields } from './lead-form-fields';
import { validateCamposPersonalizados } from '@/features/tenant/lib/custom-fields';
import type {
  CampoPersonalizado,
  CustomFieldsMap,
} from '@/features/tenant/types';

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
  /**
   * Phase 10 — custom field definitions per entity, loaded server-side and
   * passed in by the parent so the modal stays render-only. Pass `[]` if
   * none defined; the form simply omits the section.
   */
  empresaCampos: CampoPersonalizado[];
  contactoCampos: CampoPersonalizado[];
  dealCampos: CampoPersonalizado[];
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
  empresaCampos,
  contactoCampos,
  dealCampos,
}: CreateLeadModalProps) {
  const router = useRouter();
  const [fases, setFases] = useState<FaseOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [vendedorAsignado, setVendedorAsignado] = useState<string>('');
  // Phase 10 — controlled custom-field state, one map per entity. Reset on
  // close so the next open starts fresh and never leaks data across leads.
  const [empresaCamposValues, setEmpresaCamposValues] = useState<CustomFieldsMap>({});
  const [contactoCamposValues, setContactoCamposValues] = useState<CustomFieldsMap>({});
  const [dealCamposValues, setDealCamposValues] = useState<CustomFieldsMap>({});
  const [empresaCamposErrors, setEmpresaCamposErrors] = useState<Record<string, string>>({});
  const [contactoCamposErrors, setContactoCamposErrors] = useState<Record<string, string>>({});
  const [dealCamposErrors, setDealCamposErrors] = useState<Record<string, string>>({});

  // Reset the assignee + custom field state when the modal closes so the
  // next open starts fresh.
  useEffect(() => {
    if (!open) {
      setVendedorAsignado('');
      setEmpresaCamposValues({});
      setContactoCamposValues({});
      setDealCamposValues({});
      setEmpresaCamposErrors({});
      setContactoCamposErrors({});
      setDealCamposErrors({});
    }
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

      // Validate custom fields client-side. Server-side validation runs
      // again in /api/deals — this client pass is for instant feedback.
      const empresaResult = validateCamposPersonalizados(empresaCampos, empresaCamposValues);
      const contactoResult = validateCamposPersonalizados(contactoCampos, contactoCamposValues);
      const dealResult = validateCamposPersonalizados(dealCampos, dealCamposValues);
      setEmpresaCamposErrors(empresaResult.ok ? {} : empresaResult.errors);
      setContactoCamposErrors(contactoResult.ok ? {} : contactoResult.errors);
      setDealCamposErrors(dealResult.ok ? {} : dealResult.errors);
      if (!empresaResult.ok || !contactoResult.ok || !dealResult.ok) {
        toast.error('Revisa los campos personalizados marcados en rojo');
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
          campos_personalizados: empresaResult.sanitized,
        },
        contacto: {
          nombre_completo: form.get('contacto_nombre') as string,
          cargo: (form.get('cargo') as string) || undefined,
          telefono: (form.get('telefono') as string) || undefined,
          email: (form.get('email') as string) || undefined,
          campos_personalizados: contactoResult.sanitized,
        },
        deal: {
          pipeline_id: pipelineId,
          fase_actual: (form.get('fase_actual') as string) || firstFaseId,
          valor: Number(form.get('valor') || 0),
          vendedor_asignado: vendedorAsignado,
          campos_personalizados: dealResult.sanitized,
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
    [
      pipelineId,
      firstFaseId,
      onOpenChange,
      onCreated,
      router,
      vendedorAsignado,
      empresaCampos,
      empresaCamposValues,
      contactoCampos,
      contactoCamposValues,
      dealCampos,
      dealCamposValues,
    ]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <LeadFormFields
            fases={fases}
            firstFaseId={firstFaseId}
            vendedores={vendedores}
            vendedorAsignado={vendedorAsignado}
            onVendedorChange={setVendedorAsignado}
            empresaCampos={{
              definitions: empresaCampos,
              values: empresaCamposValues,
              onChange: setEmpresaCamposValues,
              errors: empresaCamposErrors,
            }}
            contactoCampos={{
              definitions: contactoCampos,
              values: contactoCamposValues,
              onChange: setContactoCamposValues,
              errors: contactoCamposErrors,
            }}
            dealCampos={{
              definitions: dealCampos,
              values: dealCamposValues,
              onChange: setDealCamposValues,
              errors: dealCamposErrors,
            }}
            disabled={submitting}
          />

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
