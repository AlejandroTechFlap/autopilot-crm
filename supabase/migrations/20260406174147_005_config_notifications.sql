-- ============================================
-- Autopilot CRM — Migration 005
-- Config tables, notifications, saved views
-- ============================================

-- Notification config (admin-managed triggers)
CREATE TABLE notificacion_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disparador_tipo TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  umbral_horas INT,
  canal canal_notificacion NOT NULL DEFAULT 'in_app',
  destinatario_id UUID REFERENCES usuarios(id),
  horario_inicio TIME,
  horario_fin TIME
);

-- KPI config (admin-managed thresholds)
CREATE TABLE kpi_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  umbral_verde DECIMAL(12, 2),
  umbral_ambar DECIMAL(12, 2),
  objetivo DECIMAL(12, 2),
  periodo TEXT DEFAULT 'mensual'
);

-- KPI snapshots (historical data points)
CREATE TABLE kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_tipo TEXT NOT NULL,
  valor DECIMAL(12, 2) NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Notification log (immutable delivery log)
CREATE TABLE notificaciones_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disparador_tipo TEXT NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  destinatario_id UUID REFERENCES usuarios(id),
  canal canal_notificacion NOT NULL,
  estado estado_notificacion NOT NULL DEFAULT 'pendiente',
  error_msg TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notificaciones_log IS 'Immutable delivery log — UPDATE and DELETE are blocked by trigger';

-- In-app notifications (user-facing)
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  contenido TEXT,
  leido BOOLEAN NOT NULL DEFAULT FALSE,
  tipo TEXT,
  referencia_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved views (custom filters for database screen)
CREATE TABLE vistas_guardadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tab TEXT NOT NULL CHECK (tab IN ('empresas', 'contactos')),
  filtros JSONB DEFAULT '{}',
  columnas JSONB DEFAULT '[]',
  compartida BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
