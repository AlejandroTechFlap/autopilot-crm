'use client';

import { Badge } from '@/components/ui/badge';
import { LIFECYCLE_LABELS, LIFECYCLE_COLORS, FUENTE_LABELS, PRIORIDAD_LABELS, PRIORIDAD_COLORS } from '@/lib/constants';
import type { Database } from '@/types/database';

type Empresa = Database['public']['Tables']['empresas']['Row'];

interface EmpresaHeaderProps {
  empresa: Empresa & {
    vendedor: { id: string; nombre: string; email: string } | null;
  };
}

export function EmpresaHeader({ empresa }: EmpresaHeaderProps) {
  const stageLabel = LIFECYCLE_LABELS[empresa.lifecycle_stage] ?? empresa.lifecycle_stage;
  const stageColor = LIFECYCLE_COLORS[empresa.lifecycle_stage] ?? '';
  const fuenteLabel = FUENTE_LABELS[empresa.fuente_lead] ?? empresa.fuente_lead;

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {empresa.nombre}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={stageColor}>
            {stageLabel}
          </Badge>
          <Badge variant="outline">{fuenteLabel}</Badge>
          {empresa.prioridad && (
            <Badge variant="secondary" className={PRIORIDAD_COLORS[empresa.prioridad]}>
              {PRIORIDAD_LABELS[empresa.prioridad]}
            </Badge>
          )}
          {empresa.provincia && (
            <Badge variant="outline">{empresa.provincia}</Badge>
          )}
        </div>
        {empresa.vendedor && (
          <p className="mt-2 text-sm text-muted-foreground">
            Asignado a{' '}
            <span className="font-medium text-foreground">
              {empresa.vendedor.nombre}
            </span>
          </p>
        )}
      </div>
      {empresa.proxima_accion && (
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Próxima acción</p>
          <p className="text-sm font-medium">{empresa.proxima_accion}</p>
          {empresa.proxima_accion_fecha && (
            <p className="text-xs text-muted-foreground">
              {new Date(empresa.proxima_accion_fecha).toLocaleDateString('es-ES')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
