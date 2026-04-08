'use client';

/**
 * Phase 10 — pure render component for custom-field inputs.
 *
 * Given a list of `CampoPersonalizado` definitions and a value map, renders
 * one controlled input per definition. Zero fetching and zero validation on
 * submit — the parent owns state, change handling, errors, and submission.
 *
 * Returns `null` when no definitions are passed so callers can mount it
 * unconditionally after their standard fields without adding whitespace.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  CampoPersonalizado,
  CustomFieldValue,
  CustomFieldsMap,
} from '@/features/tenant/types';

interface Props {
  definitions: CampoPersonalizado[];
  values: CustomFieldsMap;
  onChange: (next: CustomFieldsMap) => void;
  /** Optional per-clave error messages keyed by `def.clave`. */
  errors?: Record<string, string>;
  /** Prefix for generated input IDs so multiple instances on one page do not collide. */
  idPrefix?: string;
  disabled?: boolean;
}

export function CustomFieldsForm({
  definitions,
  values,
  onChange,
  errors,
  idPrefix = 'campo',
  disabled,
}: Props) {
  if (definitions.length === 0) return null;

  const setValue = (clave: string, v: CustomFieldValue) => {
    onChange({ ...values, [clave]: v });
  };

  return (
    <div className="space-y-3">
      {definitions.map((def) => {
        const id = `${idPrefix}-${def.clave}`;
        const error = errors?.[def.clave];
        const value = values[def.clave] ?? null;
        return (
          <div key={def.id} className="space-y-1">
            <Label htmlFor={id} className="flex items-center gap-1">
              {def.etiqueta}
              {def.obligatorio && <span className="text-destructive">*</span>}
            </Label>
            <CampoInput
              def={def}
              id={id}
              value={value}
              onValueChange={(v) => setValue(def.clave, v)}
              disabled={disabled}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}

interface CampoInputProps {
  def: CampoPersonalizado;
  id: string;
  value: CustomFieldValue;
  onValueChange: (v: CustomFieldValue) => void;
  disabled?: boolean;
}

function CampoInput({ def, id, value, onValueChange, disabled }: CampoInputProps) {
  switch (def.tipo) {
    case 'texto':
      return (
        <Input
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onValueChange(e.target.value || null)}
          disabled={disabled}
          maxLength={500}
        />
      );
    case 'numero':
      return (
        <Input
          id={id}
          type="number"
          value={typeof value === 'number' ? String(value) : ''}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === '') return onValueChange(null);
            const n = Number(raw);
            onValueChange(Number.isFinite(n) ? n : null);
          }}
          disabled={disabled}
        />
      );
    case 'fecha':
      return (
        <Input
          id={id}
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onValueChange(e.target.value || null)}
          disabled={disabled}
        />
      );
    case 'booleano':
      return (
        <Switch
          id={id}
          checked={value === true}
          onCheckedChange={(v) => onValueChange(v)}
          disabled={disabled}
        />
      );
    case 'seleccion':
      return (
        <Select
          value={typeof value === 'string' ? value : ''}
          onValueChange={(v) => onValueChange(v || null)}
          disabled={disabled}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {(def.opciones ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
  }
}
