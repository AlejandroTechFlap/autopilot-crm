-- Migration 009: tighten insert policies so only admin/direccion can create
-- new leads (empresas + deals). Vendedores can still add contactos to a
-- company they already own — the contactos policy explicitly allows that —
-- but they cannot create a brand-new company or deal.
--
-- The API layer (`requireApiRole('admin','direccion')` on POST /api/empresas
-- and POST /api/deals) already enforces this. RLS is defence in depth so a
-- bypass via raw SQL or a direct PostgREST call still fails.
--
-- See docs/phase-2-pipeline-company.md → "Lead creation — role gating".

-- ===== EMPRESAS =====
DROP POLICY IF EXISTS "empresas_insert" ON empresas;
CREATE POLICY "empresas_insert" ON empresas FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'direccion'));

-- ===== DEALS =====
DROP POLICY IF EXISTS "deals_insert" ON deals;
CREATE POLICY "deals_insert" ON deals FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('admin', 'direccion'));

-- ===== CONTACTOS =====
-- Vendedores must still be able to add additional contactos to a company
-- they already own (a normal workflow on the company detail page). They
-- cannot, however, create a contact under a brand-new empresa they're
-- inserting in the same transaction — that's the back door we're closing,
-- because the empresas_insert policy now blocks it upstream.
DROP POLICY IF EXISTS "contactos_insert" ON contactos;
CREATE POLICY "contactos_insert" ON contactos FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('admin', 'direccion')
    OR EXISTS (
      SELECT 1 FROM empresas
      WHERE empresas.id = contactos.empresa_id
        AND empresas.vendedor_asignado = auth.uid()
    )
  );
