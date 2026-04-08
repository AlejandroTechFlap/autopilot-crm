'use client';

/**
 * Phase 10 — create/edit dialog for a single custom-field definition.
 *
 * Controlled form: clave is auto-slugged from the label until the user edits
 * clave manually. `entidad` and `clave` are immutable after create (spec
 * §10.6, D3). Opciones editor and save helper live in sibling files so this
 * stays within the 300-line cap.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type {
  CampoPersonalizado,
  Entidad,
  TipoCampo,
} from '@/features/tenant/types';
import {
  ENTIDADES,
  ENTIDAD_LABELS,
  TIPOS,
  TIPO_LABELS,
  slugifyClave,
} from './campos-copy';
import { OpcionesBuilder } from './opciones-builder';
import { saveCampo, type CampoFormValues } from './save-campo';

const EMPTY: CampoFormValues = {
  entidad: 'empresa',
  clave: '',
  etiqueta: '',
  tipo: 'texto',
  opciones: [''],
  orden: 0,
  obligatorio: false,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CampoPersonalizado | null;
  defaultEntidad: Entidad;
  onSaved: () => Promise<void> | void;
}

export function CampoDialog({
  open,
  onOpenChange,
  editing,
  defaultEntidad,
  onSaved,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<CampoFormValues>(EMPTY);
  const [claveEdited, setClaveEdited] = useState(false);
  const [busy, setBusy] = useState(false);

  // Reset form whenever the dialog opens or the editing target changes.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        entidad: editing.entidad,
        clave: editing.clave,
        etiqueta: editing.etiqueta,
        tipo: editing.tipo,
        opciones: editing.opciones ?? [''],
        orden: editing.orden,
        obligatorio: editing.obligatorio,
      });
      setClaveEdited(true);
    } else {
      setForm({ ...EMPTY, entidad: defaultEntidad });
      setClaveEdited(false);
    }
  }, [open, editing, defaultEntidad]);

  const updateLabel = useCallback(
    (v: string) => {
      setForm((prev) =>
        editing || claveEdited
          ? { ...prev, etiqueta: v }
          : { ...prev, etiqueta: v, clave: slugifyClave(v) }
      );
    },
    [editing, claveEdited]
  );

  const updateClave = useCallback((v: string) => {
    setForm((prev) => ({ ...prev, clave: slugifyClave(v) }));
    setClaveEdited(true);
  }, []);

  const submit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setBusy(true);
      try {
        await saveCampo(form, editing);
        toast.success(editing ? 'Campo actualizado' : 'Campo creado');
        onOpenChange(false);
        await onSaved();
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'No se ha podido guardar el campo'
        );
      } finally {
        setBusy(false);
      }
    },
    [form, editing, onOpenChange, onSaved, router]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar campo' : 'Nuevo campo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="campo-entidad">Entidad</Label>
              <Select
                value={form.entidad}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, entidad: v as Entidad }))
                }
                disabled={editing !== null}
              >
                <SelectTrigger id="campo-entidad" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTIDADES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {ENTIDAD_LABELS[e]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="campo-tipo">Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, tipo: v as TipoCampo }))
                }
              >
                <SelectTrigger id="campo-tipo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="campo-etiqueta">Etiqueta</Label>
            <Input
              id="campo-etiqueta"
              value={form.etiqueta}
              onChange={(e) => updateLabel(e.target.value)}
              required
              maxLength={80}
              placeholder="Sector"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="campo-clave">
              Clave{' '}
              <span className="text-xs text-muted-foreground">
                (no editable tras crear)
              </span>
            </Label>
            <Input
              id="campo-clave"
              value={form.clave}
              onChange={(e) => updateClave(e.target.value)}
              required
              maxLength={40}
              disabled={editing !== null}
              className="font-mono text-xs"
              placeholder="sector"
            />
          </div>

          {form.tipo === 'seleccion' && (
            <OpcionesBuilder
              value={form.opciones}
              onChange={(opciones) =>
                setForm((prev) => ({ ...prev, opciones }))
              }
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="campo-orden">Orden</Label>
              <Input
                id="campo-orden"
                type="number"
                min={0}
                max={999}
                value={form.orden}
                onChange={(e) => {
                  const n = Number(e.target.value) || 0;
                  setForm((prev) => ({
                    ...prev,
                    orden: Math.max(0, Math.min(999, n)),
                  }));
                }}
              />
            </div>
            <div className="flex items-end gap-2 pb-1.5">
              <Switch
                id="campo-obligatorio"
                checked={form.obligatorio}
                onCheckedChange={(v) =>
                  setForm((prev) => ({ ...prev, obligatorio: v }))
                }
              />
              <Label htmlFor="campo-obligatorio" className="text-sm">
                Obligatorio
              </Label>
            </div>
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
