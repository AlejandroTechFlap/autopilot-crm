-- ============================================
-- Autopilot CRM — Migration 002
-- Pipelines, fases, empresas, contactos
-- ============================================

-- Pipelines
CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fases (pipeline stages)
CREATE TABLE fases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INT NOT NULL,
  tiempo_esperado INT, -- days expected in this phase (NULL = no limit)
  criterios_entrada JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pipeline_id, orden)
);

-- Empresas (companies / leads — master record)
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  lifecycle_stage lifecycle_stage NOT NULL DEFAULT 'lead',
  fuente_lead fuente_lead NOT NULL DEFAULT 'otro',
  vendedor_asignado UUID NOT NULL REFERENCES usuarios(id),
  proxima_accion TEXT,
  proxima_accion_fecha DATE,
  provincia TEXT,
  etiquetas TEXT[] DEFAULT '{}',
  notas_internas TEXT,
  prioridad prioridad DEFAULT 'media',
  categoria categoria_empresa,
  descripcion TEXT,
  informador TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contactos (people linked to a company)
CREATE TABLE contactos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  cargo TEXT,
  telefono TEXT,
  email TEXT,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
