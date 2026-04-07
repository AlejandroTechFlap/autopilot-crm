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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type ActivityTipo = 'llamada' | 'nota' | 'reunion';

const TIPO_LABELS: Record<ActivityTipo, string> = {
  llamada: 'Llamada',
  nota: 'Nota',
  reunion: 'Reunión',
};

const TIPO_REGISTRADO: Record<ActivityTipo, string> = {
  llamada: 'Llamada registrada',
  nota: 'Nota registrada',
  reunion: 'Reunión registrada',
};

interface QuickActivityProps {
  empresaId: string;
  empresaNombre: string;
  dealId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function QuickActivity({
  empresaId,
  empresaNombre,
  dealId,
  open,
  onOpenChange,
  onCreated,
}: QuickActivityProps) {
  const router = useRouter();
  const [tipo, setTipo] = useState<ActivityTipo>('llamada');
  const [contenido, setContenido] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!contenido.trim()) {
        toast.error('Introduce los detalles de la actividad');
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch(`/api/empresas/${empresaId}/actividades`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo,
            contenido: contenido.trim(),
            deal_id: dealId,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? 'No se ha podido registrar la actividad');
        }

        toast.success(TIPO_REGISTRADO[tipo]);
        setContenido('');
        setTipo('llamada');
        onOpenChange(false);
        onCreated?.();
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'No se ha podido registrar la actividad'
        );
      } finally {
        setSubmitting(false);
      }
    },
    [empresaId, dealId, tipo, contenido, onOpenChange, onCreated, router]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Actividad rápida — {empresaNombre}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="quick-tipo">Tipo</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as ActivityTipo)}
            >
              <SelectTrigger id="quick-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="quick-contenido">Detalles</Label>
            <Textarea
              id="quick-contenido"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="¿Qué ha ocurrido?"
              rows={4}
              required
            />
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
              {submitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
