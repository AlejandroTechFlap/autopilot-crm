-- ============================================
-- Autopilot CRM — Migration 010
-- Phase 10: multi-instance per-tenant install
--   - configuracion_tenant  (singleton row: brand + feature flags)
--   - campos_personalizados (tenant-defined custom field definitions)
--   - JSONB campos_personalizados columns on empresas/contactos/deals
--   - brand-assets storage bucket
-- ============================================
-- Model: per-customer install, one Supabase project per customer. No
-- cross-tenant isolation needed — each database already belongs to exactly
-- one tenant. See docs/phase-10-multi-instance.md.

-- ===== 10.1 — configuracion_tenant (singleton) =====

CREATE TABLE configuracion_tenant (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Brand
  nombre_empresa            TEXT NOT NULL DEFAULT 'Autopilot CRM',
  logo_url                  TEXT,
  color_primario            TEXT NOT NULL DEFAULT '#0f172a',
  color_acento              TEXT NOT NULL DEFAULT '#3b82f6',
  direccion                 TEXT,
  email_contacto            TEXT,
  telefono                  TEXT,
  -- Feature flags (fixed catalog — see phase-10 spec)
  feat_ai_chat              BOOLEAN NOT NULL DEFAULT TRUE,
  feat_morning_summary      BOOLEAN NOT NULL DEFAULT TRUE,
  feat_command_palette      BOOLEAN NOT NULL DEFAULT TRUE,
  feat_dashboard_historico  BOOLEAN NOT NULL DEFAULT TRUE,
  feat_admin_kpis           BOOLEAN NOT NULL DEFAULT TRUE,
  feat_admin_scripts        BOOLEAN NOT NULL DEFAULT TRUE,
  feat_notifications        BOOLEAN NOT NULL DEFAULT TRUE,
  feat_empresa_task_cal     BOOLEAN NOT NULL DEFAULT TRUE,
  -- Bookkeeping
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by                UUID REFERENCES usuarios(id),
  -- Hex colours (client also validates; this is defence in depth)
  CONSTRAINT color_primario_hex CHECK (color_primario ~ '^#[0-9a-fA-F]{6}$'),
  CONSTRAINT color_acento_hex   CHECK (color_acento   ~ '^#[0-9a-fA-F]{6}$')
);

-- Enforce singleton: a unique index on a constant expression rejects any
-- second insert.
CREATE UNIQUE INDEX configuracion_tenant_singleton
  ON configuracion_tenant ((TRUE));

-- Seed the one row so the app always has a brand to read.
INSERT INTO configuracion_tenant DEFAULT VALUES;

-- RLS: brand is readable by every authenticated user (sidebar, layout).
-- Only admin can update. Insert and delete are not allowed — the singleton
-- is created once here and lives forever.
ALTER TABLE configuracion_tenant ENABLE ROW LEVEL SECURITY;

CREATE POLICY "configuracion_tenant_select" ON configuracion_tenant
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "configuracion_tenant_update" ON configuracion_tenant
  FOR UPDATE TO authenticated
  USING (get_user_role() = 'admin');

-- updated_at trigger so PATCHes always bump the mtime.
CREATE OR REPLACE FUNCTION public.touch_configuracion_tenant()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER configuracion_tenant_updated_at
  BEFORE UPDATE ON configuracion_tenant
  FOR EACH ROW EXECUTE FUNCTION public.touch_configuracion_tenant();


-- ===== 10.2 — campos_personalizados (definitions) =====

CREATE TYPE entidad_personalizable  AS ENUM ('empresa', 'contacto', 'deal');
CREATE TYPE tipo_campo_personalizado AS ENUM ('texto', 'numero', 'seleccion', 'fecha', 'booleano');

CREATE TABLE campos_personalizados (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad     entidad_personalizable NOT NULL,
  clave       TEXT NOT NULL,
  etiqueta    TEXT NOT NULL,
  tipo        tipo_campo_personalizado NOT NULL,
  opciones    JSONB,                              -- only for tipo = 'seleccion'
  orden       INT NOT NULL DEFAULT 0,
  obligatorio BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entidad, clave),
  -- clave must be a safe JSONB-key slug (lowercase, alnum, underscore)
  CONSTRAINT clave_slug CHECK (clave ~ '^[a-z][a-z0-9_]*$')
);

CREATE INDEX campos_personalizados_entidad_orden
  ON campos_personalizados (entidad, orden);

ALTER TABLE campos_personalizados ENABLE ROW LEVEL SECURITY;

-- Every authenticated user needs to read the definitions so forms can
-- render the extra inputs. Only admin can write.
CREATE POLICY "campos_personalizados_select" ON campos_personalizados
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "campos_personalizados_modify" ON campos_personalizados
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');


-- ===== 10.3 — JSONB columns on the three main entities =====

ALTER TABLE empresas  ADD COLUMN campos_personalizados JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE contactos ADD COLUMN campos_personalizados JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE deals     ADD COLUMN campos_personalizados JSONB NOT NULL DEFAULT '{}'::jsonb;

-- No GIN index in v1: we do not search/filter on custom fields yet. Add
-- `CREATE INDEX ... USING GIN (campos_personalizados)` per-entity when list
-- filters land in v2.


-- ===== 10.4 — brand-assets storage bucket =====

-- Public bucket: logos are loaded unauthenticated from the browser. Admin
-- holds write permission via the policies below.
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Read open to anyone (public bucket). Write / update / delete restricted
-- to admin only — vendedores and direccion cannot touch brand assets.
CREATE POLICY "brand_assets_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'brand-assets');

CREATE POLICY "brand_assets_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-assets' AND get_user_role() = 'admin');

CREATE POLICY "brand_assets_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-assets' AND get_user_role() = 'admin');

CREATE POLICY "brand_assets_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'brand-assets' AND get_user_role() = 'admin');
