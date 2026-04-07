export interface DashboardKpis {
  total_pipeline_value: number;
  deals_abiertos: number;
  deals_ganados: number;
  deals_perdidos: number;
  tasa_conversion: number;
  valor_ganado: number;
  ticket_medio: number;
  actividades_periodo: number;
  tareas_vencidas: number;
}

export interface VendedorStats {
  vendedor: { id: string; nombre: string };
  deals_abiertos: number;
  valor_pipeline: number;
  deals_ganados: number;
  actividades: number;
}

export interface PrevKpis {
  deals_ganados: number;
  valor_ganado: number;
  tasa_conversion: number;
  ticket_medio: number;
}

export interface DashboardData {
  kpis: DashboardKpis;
  prev_kpis: PrevKpis;
  por_vendedor: VendedorStats[];
}

export interface ChartPoint {
  fecha: string;
  valor: number;
}

export type Periodo = '7d' | 'month' | 'quarter';

export type ChartType =
  | 'pipeline_value'
  | 'deals_ganados'
  | 'actividades'
  | 'conversion';

export type DrillType =
  | 'pipeline_value'
  | 'deals_ganados'
  | 'conversion'
  | 'ticket_medio'
  | 'tareas_vencidas';

export interface DrillSummaryStat {
  label: string;
  value: string;
}

export interface DrillVendedorRow {
  vendedor_id: string;
  vendedor: string;
  count: number;
  valor?: number;
  ganados?: number;
  perdidos?: number;
  rate?: number;
}

export interface DrillItem {
  id: string;
  primary: string;
  secondary?: string | null;
  vendedor?: string | null;
  valor?: number | null;
  date?: string | null;
  href?: string | null;
}

export interface DrillData {
  title: string;
  summary: DrillSummaryStat[];
  by_vendedor: DrillVendedorRow[];
  items: DrillItem[];
}
