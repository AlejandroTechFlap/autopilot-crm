-- ============================================
-- Autopilot CRM — Migration 008
-- Daily AI briefings cache (one per user per day)
-- ============================================

CREATE TABLE briefings_diarios (
  user_id     uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha       date NOT NULL,
  contenido   text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, fecha)
);

CREATE INDEX briefings_diarios_user_idx ON briefings_diarios (user_id, fecha DESC);

ALTER TABLE briefings_diarios ENABLE ROW LEVEL SECURITY;

-- Each user can only read their own briefings.
CREATE POLICY briefings_select_own ON briefings_diarios
  FOR SELECT USING (user_id = auth.uid());

-- Inserts/updates happen via the API route (service role bypasses RLS),
-- but we still allow the user to write their own row in case we ever
-- call from the browser.
CREATE POLICY briefings_insert_own ON briefings_diarios
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY briefings_update_own ON briefings_diarios
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
