/**
 * Labels, colors, and display maps for CRM enums.
 */

import type { Database } from '@/types/database';

type LifecycleStage = Database['public']['Enums']['lifecycle_stage'];
type FuenteLead = Database['public']['Enums']['fuente_lead'];
type Prioridad = Database['public']['Enums']['prioridad'];
type TipoActividad = Database['public']['Enums']['tipo_actividad'];
type CategoriaEmpresa = Database['public']['Enums']['categoria_empresa'];
type RolUsuario = Database['public']['Enums']['rol_usuario'];

export const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  lead: 'Lead',
  contactado: 'Contactado',
  en_negociacion: 'En negociación',
  cliente: 'Cliente',
  ex_cliente: 'Ex cliente',
  no_interesa: 'No interesa',
};

export const LIFECYCLE_COLORS: Record<LifecycleStage, string> = {
  lead: 'bg-info-light text-info',
  contactado: 'bg-warning-light text-warning',
  en_negociacion: 'bg-primary/10 text-primary',
  cliente: 'bg-success-light text-success',
  ex_cliente: 'bg-muted text-muted-foreground',
  no_interesa: 'bg-danger-light text-danger',
};

export const FUENTE_LABELS: Record<FuenteLead, string> = {
  ads: 'Ads',
  organico: 'Orgánico',
  referido: 'Referido',
  bbdd: 'BBDD',
  feria: 'Feria',
  cold_call: 'Llamada en frío',
  otro: 'Otro',
};

export const PRIORIDAD_LABELS: Record<Prioridad, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export const PRIORIDAD_COLORS: Record<Prioridad, string> = {
  alta: 'bg-danger-light text-danger',
  media: 'bg-warning-light text-warning',
  baja: 'bg-muted text-muted-foreground',
};

export const ACTIVIDAD_LABELS: Record<TipoActividad, string> = {
  llamada: 'Llamada',
  nota: 'Nota',
  reunion: 'Reunión',
  cambio_fase: 'Cambio de fase',
  sistema: 'Sistema',
};

export const ACTIVIDAD_ICONS: Record<TipoActividad, string> = {
  llamada: 'Phone',
  nota: 'StickyNote',
  reunion: 'Users',
  cambio_fase: 'ArrowRight',
  sistema: 'Settings',
};

export const CATEGORIA_LABELS: Record<CategoriaEmpresa, string> = {
  mascotas: 'Mascotas',
  veterinaria: 'Veterinaria',
  agro: 'Agro',
  retail: 'Retail',
  servicios: 'Servicios',
  otro: 'Otro',
};

export const ROL_LABELS: Record<RolUsuario, string> = {
  admin: 'Administrador',
  direccion: 'Dirección',
  vendedor: 'Vendedor',
};
