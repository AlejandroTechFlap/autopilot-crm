'use client';

import { useCallback, useState } from 'react';
import { Phone, StickyNote, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ActivityType = 'llamada' | 'nota' | 'reunion';

const ACTION_BUTTONS: { tipo: ActivityType; label: string; icon: React.ElementType }[] = [
  { tipo: 'llamada', label: 'Llamada', icon: Phone },
  { tipo: 'nota', label: 'Nota', icon: StickyNote },
  { tipo: 'reunion', label: 'Reunión', icon: Users },
];

interface EmpresaActionsProps {
  empresaId: string;
  onActivityCreated?: () => void;
}

export function EmpresaActions({ empresaId, onActivityCreated }: EmpresaActionsProps) {
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!selectedType || !content.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/empresas/${empresaId}/actividades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: selectedType, contenido: content.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'No se pudo crear la actividad');
      }

      toast.success('Actividad registrada');
      setContent('');
      setSelectedType(null);
      onActivityCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo registrar la actividad');
    } finally {
      setSubmitting(false);
    }
  }, [empresaId, selectedType, content, onActivityCreated]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {ACTION_BUTTONS.map(({ tipo, label, icon: Icon }) => (
          <Button
            key={tipo}
            size="sm"
            variant={selectedType === tipo ? 'default' : 'outline'}
            className="gap-1.5"
            onClick={() =>
              setSelectedType((prev) => (prev === tipo ? null : tipo))
            }
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>

      {selectedType && (
        <div className="space-y-2">
          <Textarea
            placeholder={`Describe la ${selectedType === 'llamada' ? 'llamada' : selectedType === 'reunion' ? 'reunión' : 'nota'}...`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedType(null);
                setContent('');
              }}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={!content.trim() || submitting}
              onClick={handleSubmit}
            >
              {submitting ? 'Guardando...' : 'Registrar actividad'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
