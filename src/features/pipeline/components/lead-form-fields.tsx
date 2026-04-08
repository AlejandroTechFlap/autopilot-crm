'use client';

/**
 * Phase 10 — extracted form body for `CreateLeadModal`.
 *
 * Pure render helper that owns the layout of the four lead-creation
 * fieldsets (Empresa, Contacto, Oportunidad, Asignación). Standard inputs
 * remain uncontrolled (read via `FormData` in the parent's submit handler);
 * vendedor and the three custom-field maps are controlled by the parent so
 * validation errors can be surfaced inline.
 *
 * Splitting this out keeps `create-lead-modal.tsx` below the 300-line cap
 * once Phase 10 custom-fields integration lands.
 */

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
import { CustomFieldsForm } from '@/features/tenant/components/custom-fields-form';
import type {
  CampoPersonalizado,
  CustomFieldsMap,
} from '@/features/tenant/types';

interface FaseOption {
  id: string;
  nombre: string;
  orden: number;
}

interface CamposSlot {
  definitions: CampoPersonalizado[];
  values: CustomFieldsMap;
  onChange: (next: CustomFieldsMap) => void;
  errors?: Record<string, string>;
}

interface Props {
  fases: FaseOption[];
  firstFaseId: string;
  vendedores: { id: string; nombre: string }[];
  vendedorAsignado: string;
  onVendedorChange: (id: string) => void;
  empresaCampos: CamposSlot;
  contactoCampos: CamposSlot;
  dealCampos: CamposSlot;
  disabled?: boolean;
}

export function LeadFormFields({
  fases,
  firstFaseId,
  vendedores,
  vendedorAsignado,
  onVendedorChange,
  empresaCampos,
  contactoCampos,
  dealCampos,
  disabled,
}: Props) {
  return (
    <>
      {/* Company section */}
      <fieldset className="space-y-3" disabled={disabled}>
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
        <CustomFieldsForm
          definitions={empresaCampos.definitions}
          values={empresaCampos.values}
          onChange={empresaCampos.onChange}
          errors={empresaCampos.errors}
          idPrefix="empresa-campo"
          disabled={disabled}
        />
      </fieldset>

      {/* Contact section */}
      <fieldset className="space-y-3" disabled={disabled}>
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
        <CustomFieldsForm
          definitions={contactoCampos.definitions}
          values={contactoCampos.values}
          onChange={contactoCampos.onChange}
          errors={contactoCampos.errors}
          idPrefix="contacto-campo"
          disabled={disabled}
        />
      </fieldset>

      {/* Deal section */}
      <fieldset className="space-y-3" disabled={disabled}>
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
        <CustomFieldsForm
          definitions={dealCampos.definitions}
          values={dealCampos.values}
          onChange={dealCampos.onChange}
          errors={dealCampos.errors}
          idPrefix="deal-campo"
          disabled={disabled}
        />
      </fieldset>

      {/* Assignment section — required pick, no implicit self-assignment. */}
      <fieldset className="space-y-3" disabled={disabled}>
        <legend className="text-sm font-medium text-foreground">Asignación</legend>
        <div className="space-y-1">
          <Label htmlFor="vendedor_asignado">Vendedor asignado *</Label>
          <Select
            value={vendedorAsignado}
            onValueChange={(v) => onVendedorChange(v ?? '')}
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
    </>
  );
}
