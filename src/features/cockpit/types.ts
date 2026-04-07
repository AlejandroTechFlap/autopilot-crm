import type { Database } from '@/types/database';

type Prioridad = Database['public']['Enums']['prioridad'];
type OrigenTarea = Database['public']['Enums']['origen_tarea'];

export interface Task {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: Prioridad;
  fecha_vencimiento: string | null;
  completada: boolean;
  origen: OrigenTarea;
  tipo_tarea: string | null;
  created_at: string;
  updated_at: string;
  empresa: { id: string; nombre: string } | null;
  deal: { id: string; valor: number } | null;
}

export interface PersonalKpis {
  deals_abiertos: number;
  valor_pipeline: number;
  tareas_pendientes: number;
  tareas_vencidas: number;
  actividades_hoy: number;
  deals_ganados_mes: number;
  valor_ganado_mes: number;
  comision_mes: number;
}

export interface Script {
  id: string;
  titulo: string;
  contenido: string;
  tags: string[] | null;
  created_at: string;
  fase: { id: string; nombre: string } | null;
}
