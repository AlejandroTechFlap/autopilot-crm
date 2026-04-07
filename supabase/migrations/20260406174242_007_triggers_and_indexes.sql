-- ============================================
-- Autopilot CRM — Migration 007
-- Triggers and indexes
-- ============================================

-- === IMMUTABILITY TRIGGERS ===

-- Prevent UPDATE/DELETE on actividades
CREATE OR REPLACE FUNCTION prevent_modify()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Records in % are immutable and cannot be modified', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actividades_immutable
  BEFORE UPDATE OR DELETE ON actividades
  FOR EACH ROW EXECUTE FUNCTION prevent_modify();

CREATE TRIGGER notificaciones_log_immutable
  BEFORE UPDATE OR DELETE ON notificaciones_log
  FOR EACH ROW EXECUTE FUNCTION prevent_modify();

-- === AUTO-UPDATE updated_at ===

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tareas_updated_at
  BEFORE UPDATE ON tareas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- === INDEXES ===

-- Empresas: filter by assigned seller
CREATE INDEX idx_empresas_vendedor ON empresas(vendedor_asignado);
CREATE INDEX idx_empresas_lifecycle ON empresas(lifecycle_stage);
CREATE INDEX idx_empresas_fuente ON empresas(fuente_lead);

-- Contactos: lookup by company + primary flag
CREATE INDEX idx_contactos_empresa ON contactos(empresa_id);
CREATE INDEX idx_contactos_principal ON contactos(empresa_id, es_principal) WHERE es_principal = TRUE;

-- Deals: pipeline queries
CREATE INDEX idx_deals_fase ON deals(fase_actual);
CREATE INDEX idx_deals_vendedor ON deals(vendedor_asignado);
CREATE INDEX idx_deals_pipeline_fase ON deals(pipeline_id, fase_actual);
CREATE INDEX idx_deals_abiertos ON deals(pipeline_id) WHERE resultado IS NULL;

-- Actividades: timeline queries
CREATE INDEX idx_actividades_empresa ON actividades(empresa_id, created_at DESC);
CREATE INDEX idx_actividades_deal ON actividades(deal_id, created_at DESC);
CREATE INDEX idx_actividades_usuario ON actividades(usuario_id, created_at DESC);

-- Tareas: cockpit queries
CREATE INDEX idx_tareas_vendedor ON tareas(vendedor_asignado, completada, fecha_vencimiento);
CREATE INDEX idx_tareas_pendientes ON tareas(vendedor_asignado, fecha_vencimiento)
  WHERE completada = FALSE;

-- Comisiones
CREATE INDEX idx_comisiones_vendedor ON comisiones(vendedor_id);

-- Notificaciones: user bell
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id, leido, created_at DESC);

-- Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE deals;
ALTER PUBLICATION supabase_realtime ADD TABLE actividades;
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE tareas;
