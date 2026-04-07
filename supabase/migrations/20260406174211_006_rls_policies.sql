-- ============================================
-- Autopilot CRM — Migration 006
-- Row Level Security policies
-- ============================================

-- Helper: get current user's role from usuarios table
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS rol_usuario AS $$
  SELECT rol FROM usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE fases ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacion_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE vistas_guardadas ENABLE ROW LEVEL SECURITY;

-- ===== USUARIOS =====
CREATE POLICY "usuarios_select" ON usuarios FOR SELECT TO authenticated
  USING (TRUE);
CREATE POLICY "usuarios_insert" ON usuarios FOR INSERT TO authenticated
  WITH CHECK (get_user_role() = 'admin');
CREATE POLICY "usuarios_update" ON usuarios FOR UPDATE TO authenticated
  USING (id = auth.uid() OR get_user_role() = 'admin');

-- ===== PIPELINES / FASES (read-all, admin writes) =====
CREATE POLICY "pipelines_select" ON pipelines FOR SELECT TO authenticated
  USING (TRUE);
CREATE POLICY "pipelines_modify" ON pipelines FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "fases_select" ON fases FOR SELECT TO authenticated
  USING (TRUE);
CREATE POLICY "fases_modify" ON fases FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- ===== EMPRESAS =====
-- Admin/direccion: see all. Vendedor: see assigned.
CREATE POLICY "empresas_select" ON empresas FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('admin', 'direccion')
    OR vendedor_asignado = auth.uid()
  );
CREATE POLICY "empresas_insert" ON empresas FOR INSERT TO authenticated
  WITH CHECK (TRUE);
CREATE POLICY "empresas_update" ON empresas FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('admin', 'direccion')
    OR vendedor_asignado = auth.uid()
  );

-- ===== CONTACTOS =====
CREATE POLICY "contactos_select" ON contactos FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('admin', 'direccion')
    OR EXISTS (
      SELECT 1 FROM empresas WHERE empresas.id = contactos.empresa_id
        AND empresas.vendedor_asignado = auth.uid()
    )
  );
CREATE POLICY "contactos_insert" ON contactos FOR INSERT TO authenticated
  WITH CHECK (TRUE);
CREATE POLICY "contactos_update" ON contactos FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('admin', 'direccion')
    OR EXISTS (
      SELECT 1 FROM empresas WHERE empresas.id = contactos.empresa_id
        AND empresas.vendedor_asignado = auth.uid()
    )
  );

-- ===== DEALS =====
CREATE POLICY "deals_select" ON deals FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('admin', 'direccion')
    OR vendedor_asignado = auth.uid()
  );
CREATE POLICY "deals_insert" ON deals FOR INSERT TO authenticated
  WITH CHECK (TRUE);
CREATE POLICY "deals_update" ON deals FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('admin', 'direccion')
    OR vendedor_asignado = auth.uid()
  );

-- ===== ACTIVIDADES (insert-only for all, select based on empresa) =====
CREATE POLICY "actividades_select" ON actividades FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('admin', 'direccion')
    OR EXISTS (
      SELECT 1 FROM empresas WHERE empresas.id = actividades.empresa_id
        AND empresas.vendedor_asignado = auth.uid()
    )
  );
CREATE POLICY "actividades_insert" ON actividades FOR INSERT TO authenticated
  WITH CHECK (TRUE);
-- No UPDATE/DELETE policies — trigger also enforces immutability

-- ===== TAREAS =====
CREATE POLICY "tareas_select" ON tareas FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('admin', 'direccion')
    OR vendedor_asignado = auth.uid()
  );
CREATE POLICY "tareas_insert" ON tareas FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('admin', 'direccion')
    OR vendedor_asignado = auth.uid()
  );
CREATE POLICY "tareas_update" ON tareas FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('admin', 'direccion')
    OR vendedor_asignado = auth.uid()
  );

-- ===== COMISIONES =====
CREATE POLICY "comisiones_select" ON comisiones FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('admin', 'direccion')
    OR vendedor_id = auth.uid()
  );
CREATE POLICY "comisiones_modify" ON comisiones FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- ===== SCRIPTS =====
CREATE POLICY "scripts_select" ON scripts FOR SELECT TO authenticated
  USING (TRUE);
CREATE POLICY "scripts_modify" ON scripts FOR ALL TO authenticated
  USING (get_user_role() IN ('admin', 'direccion'));

-- ===== CONFIG TABLES (admin only) =====
CREATE POLICY "notificacion_config_select" ON notificacion_config FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'direccion'));
CREATE POLICY "notificacion_config_modify" ON notificacion_config FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "kpi_config_select" ON kpi_config FOR SELECT TO authenticated
  USING (TRUE);
CREATE POLICY "kpi_config_modify" ON kpi_config FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

CREATE POLICY "kpi_snapshots_select" ON kpi_snapshots FOR SELECT TO authenticated
  USING (TRUE);
CREATE POLICY "kpi_snapshots_modify" ON kpi_snapshots FOR ALL TO authenticated
  USING (get_user_role() = 'admin');

-- ===== NOTIFICATION LOG (immutable, read by recipient) =====
CREATE POLICY "notificaciones_log_select" ON notificaciones_log FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('admin', 'direccion')
    OR destinatario_id = auth.uid()
  );
CREATE POLICY "notificaciones_log_insert" ON notificaciones_log FOR INSERT TO authenticated
  WITH CHECK (TRUE);

-- ===== IN-APP NOTIFICATIONS =====
CREATE POLICY "notificaciones_select" ON notificaciones FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());
CREATE POLICY "notificaciones_update" ON notificaciones FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid());
CREATE POLICY "notificaciones_insert" ON notificaciones FOR INSERT TO authenticated
  WITH CHECK (TRUE);

-- ===== SAVED VIEWS =====
CREATE POLICY "vistas_select" ON vistas_guardadas FOR SELECT TO authenticated
  USING (usuario_id = auth.uid() OR compartida = TRUE);
CREATE POLICY "vistas_modify" ON vistas_guardadas FOR ALL TO authenticated
  USING (usuario_id = auth.uid());
