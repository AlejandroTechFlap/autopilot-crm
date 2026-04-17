-- ============================================
-- Autopilot CRM — Migration 013
-- Phase 12: AI Pro Pack
--   - 3 new feature flags on configuracion_tenant
--   - ai_sugerencias_proxima_accion (per-day cache for "Próxima acción")
-- ============================================
-- See docs/phase-12-ai-pro-pack.md for the full spec.

-- ===== 12.1 — feature flags =====

ALTER TABLE configuracion_tenant
  ADD COLUMN feat_ai_lead_capture     BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN feat_ai_next_action      BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN feat_ai_command_palette  BOOLEAN NOT NULL DEFAULT TRUE;


-- ===== 12.2 — ai_sugerencias_proxima_accion =====
-- One row per (entity, day). Reads inherit visibility from the underlying
-- entity (deals or empresas) so RLS does not need to duplicate ownership
-- logic. Writes are unrestricted to authenticated because the server route
-- is rate-limited and the row content is derived from data the user can
-- already read.

CREATE TABLE ai_sugerencias_proxima_accion (
  entity_type      TEXT NOT NULL,
  entity_id        UUID NOT NULL,
  fecha            DATE NOT NULL,
  suggestion_json  JSONB NOT NULL,
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entity_type, entity_id, fecha),
  CONSTRAINT ai_sugerencias_entity_type_check
    CHECK (entity_type IN ('empresa', 'deal'))
);

CREATE INDEX ai_sugerencias_fecha
  ON ai_sugerencias_proxima_accion (fecha);

ALTER TABLE ai_sugerencias_proxima_accion ENABLE ROW LEVEL SECURITY;

-- SELECT: row is visible iff the user can read the underlying entity.
CREATE POLICY "ai_sugerencias_select" ON ai_sugerencias_proxima_accion
  FOR SELECT TO authenticated
  USING (
    (entity_type = 'empresa' AND EXISTS (
      SELECT 1 FROM empresas WHERE empresas.id = entity_id
    ))
    OR
    (entity_type = 'deal' AND EXISTS (
      SELECT 1 FROM deals WHERE deals.id = entity_id
    ))
  );

-- INSERT / UPDATE / DELETE: same gate. The server route rate-limits writes.
CREATE POLICY "ai_sugerencias_insert" ON ai_sugerencias_proxima_accion
  FOR INSERT TO authenticated
  WITH CHECK (
    (entity_type = 'empresa' AND EXISTS (
      SELECT 1 FROM empresas WHERE empresas.id = entity_id
    ))
    OR
    (entity_type = 'deal' AND EXISTS (
      SELECT 1 FROM deals WHERE deals.id = entity_id
    ))
  );

CREATE POLICY "ai_sugerencias_update" ON ai_sugerencias_proxima_accion
  FOR UPDATE TO authenticated
  USING (
    (entity_type = 'empresa' AND EXISTS (
      SELECT 1 FROM empresas WHERE empresas.id = entity_id
    ))
    OR
    (entity_type = 'deal' AND EXISTS (
      SELECT 1 FROM deals WHERE deals.id = entity_id
    ))
  );

CREATE POLICY "ai_sugerencias_delete" ON ai_sugerencias_proxima_accion
  FOR DELETE TO authenticated
  USING (
    (entity_type = 'empresa' AND EXISTS (
      SELECT 1 FROM empresas WHERE empresas.id = entity_id
    ))
    OR
    (entity_type = 'deal' AND EXISTS (
      SELECT 1 FROM deals WHERE deals.id = entity_id
    ))
  );
