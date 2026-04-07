-- ============================================
-- Autopilot CRM — Migration 003
-- Deals and actividades (immutable audit log)
-- ============================================

-- Deals (sales opportunities)
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES pipelines(id),
  fase_actual UUID NOT NULL REFERENCES fases(id),
  valor DECIMAL(12, 2) NOT NULL DEFAULT 0,
  vendedor_asignado UUID NOT NULL REFERENCES usuarios(id),
  fecha_entrada_fase TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  motivo_perdida TEXT,
  cerrado_en TIMESTAMPTZ,
  resultado resultado_deal,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Actividades (immutable audit log)
CREATE TABLE actividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  contacto_id UUID REFERENCES contactos(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  tipo tipo_actividad NOT NULL,
  contenido TEXT,
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE actividades IS 'Immutable audit log — UPDATE and DELETE are blocked by trigger';
