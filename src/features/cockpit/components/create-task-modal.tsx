'use client';

import { useCallback, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateTaskModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  /** When set, the new task is pre-scoped to this empresa. */
  empresaId?: string;
}

function handleSelectChange(
  setter: (v: string) => void
): (value: string | null) => void {
  return (value) => setter(value ?? 'media');
}

export function CreateTaskModal({
  userId,
  open,
  onOpenChange,
  onCreated,
  empresaId,
}: CreateTaskModalProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [prioridad, setPrioridad] = useState('media');

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setSubmitting(true);

      const form = new FormData(e.currentTarget);

      const payload = {
        titulo: form.get('titulo') as string,
        descripcion: (form.get('descripcion') as string) || undefined,
        prioridad,
        fecha_vencimiento:
          (form.get('fecha_vencimiento') as string) || undefined,
        vendedor_asignado: userId,
        ...(empresaId ? { empresa_id: empresaId } : {}),
      };

      try {
        const res = await fetch('/api/tareas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'No se ha podido crear la tarea');
        }

        toast.success('Tarea creada');
        onOpenChange(false);
        onCreated?.();
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'No se ha podido crear la tarea'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [userId, prioridad, empresaId, onOpenChange, onCreated, router]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" name="titulo" required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea id="descripcion" name="descripcion" rows={3} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Prioridad</Label>
              <Select
                value={prioridad}
                onValueChange={handleSelectChange(setPrioridad)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="fecha_vencimiento">Fecha de vencimiento</Label>
              <Input
                id="fecha_vencimiento"
                name="fecha_vencimiento"
                type="date"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
