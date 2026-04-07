-- ============================================
-- Autopilot CRM — Migration 004
-- Tareas, comisiones, scripts
-- ============================================

-- Tareas (tasks for sellers)
CREATE TABLE tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  vendedor_asignado UUID NOT NULL REFERENCES usuarios(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  prioridad prioridad NOT NULL DEFAULT 'media',
  fecha_vencimiento DATE,
  completada BOOLEAN NOT NULL DEFAULT FALSE,
  origen origen_tarea NOT NULL DEFAULT 'manual',
  tipo_tarea TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comisiones (seller commissions on closed deals)
CREATE TABLE comisiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  vendedor_id UUID NOT NULL REFERENCES usuarios(id),
  valor_deal DECIMAL(12, 2) NOT NULL,
  porcentaje DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
  importe_comision DECIMAL(12, 2) NOT NULL,
  periodo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scripts (sales scripts library)
CREATE TABLE scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  fase_asociada UUID REFERENCES fases(id) ON DELETE SET NULL,
  contenido TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
