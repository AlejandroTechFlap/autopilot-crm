'use client';

/**
 * Phase 10 — small editor for the `opciones` list of a `seleccion` custom
 * field. Controlled: parent owns the string[] state.
 */

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

export function OpcionesBuilder({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label>Opciones</Label>
      {value.map((op, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={op}
            maxLength={80}
            placeholder={`Opción ${i + 1}`}
            onChange={(e) => {
              const next = [...value];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          {value.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Quitar opción"
              onClick={() => onChange(value.filter((_, k) => k !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => onChange([...value, ''])}
      >
        <Plus className="h-3 w-3" /> Añadir opción
      </Button>
    </div>
  );
}
