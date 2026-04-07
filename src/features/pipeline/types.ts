import type { SemaphoreColor } from './lib/semaphore';

export interface PipelineDeal {
  id: string;
  valor: number;
  fecha_entrada_fase: string;
  fase_actual: string;
  resultado: 'ganado' | 'perdido' | null;
  motivo_perdida: string | null;
  cerrado_en: string | null;
  created_at: string;
  empresa: {
    id: string;
    nombre: string;
    fuente_lead: string;
    proxima_accion: string | null;
    proxima_accion_fecha: string | null;
    lifecycle_stage: string;
  };
  vendedor: {
    id: string;
    nombre: string;
  };
  semaphore: SemaphoreColor;
  days_in_phase: number;
  semaphore_pct: number;
}

export interface PipelineFase {
  id: string;
  nombre: string;
  orden: number;
  tiempo_esperado: number | null;
  deals: PipelineDeal[];
}

export interface PipelineData {
  pipeline: {
    id: string;
    nombre: string;
  };
  fases: PipelineFase[];
}
