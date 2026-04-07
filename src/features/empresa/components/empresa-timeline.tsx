'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Phone,
  StickyNote,
  Users,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/formatting';
import { ACTIVIDAD_LABELS } from '@/lib/constants';
import type { Database } from '@/types/database';

type TipoActividad = Database['public']['Enums']['tipo_actividad'];

const ICON_MAP: Record<TipoActividad, React.ElementType> = {
  llamada: Phone,
  nota: StickyNote,
  reunion: Users,
  cambio_fase: ArrowRight,
  sistema: Settings,
};

const COLOR_MAP: Record<TipoActividad, string> = {
  llamada: 'bg-info-light text-info',
  nota: 'bg-warning-light text-warning',
  reunion: 'bg-primary/10 text-primary',
  cambio_fase: 'bg-muted text-muted-foreground',
  sistema: 'bg-muted text-muted-foreground',
};

interface Activity {
  id: string;
  tipo: TipoActividad;
  contenido: string;
  created_at: string;
  usuario: { id: string; nombre: string } | null;
  contacto: { id: string; nombre_completo: string } | null;
  deal: { id: string; valor: number } | null;
}

interface EmpresaTimelineProps {
  empresaId: string;
}

export function EmpresaTimeline({ empresaId }: EmpresaTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/empresas/${empresaId}/actividades?limit=50`
      );
      if (res.ok) {
        const data = await res.json();
        setActivities(data.actividades ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Cargando historial...</p>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aún no hay actividad.</p>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

      {activities.map((a) => {
        const Icon = ICON_MAP[a.tipo] ?? Settings;
        const colorClass = COLOR_MAP[a.tipo] ?? COLOR_MAP.sistema;

        return (
          <div key={a.id} className="relative flex gap-3 pb-4">
            <div
              className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium">
                  {ACTIVIDAD_LABELS[a.tipo]}
                </span>
                {a.usuario && (
                  <span className="text-xs text-muted-foreground">
                    por {a.usuario.nombre}
                  </span>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {formatRelativeTime(a.created_at)}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-foreground">{a.contenido}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Imperatively trigger a reload from parent */
export type TimelineRef = { reload: () => void };
