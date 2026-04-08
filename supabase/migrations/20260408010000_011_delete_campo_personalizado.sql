-- ============================================
-- Autopilot CRM — Migration 011
-- Phase 10 — transactional delete for campos_personalizados
--   - Locked decision D3: when a definition is deleted, its JSONB key must
--     be stripped from every row in the matching entity table, wrapped in
--     the same transaction as the DELETE from campos_personalizados.
--   - Supabase JS has no multi-statement transactions, so we wrap the
--     logic in a plpgsql function and call it via rpc().
-- ============================================

CREATE OR REPLACE FUNCTION public.delete_campo_personalizado(p_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_entidad entidad_personalizable;
  v_clave   TEXT;
  v_rows    INTEGER := 0;
BEGIN
  -- 1. Look up the definition. RLS on campos_personalizados will reject
  --    non-admin callers before this point; if the row is missing we
  --    raise to let the API return a 404.
  SELECT entidad, clave
    INTO v_entidad, v_clave
    FROM campos_personalizados
   WHERE id = p_id;

  IF v_entidad IS NULL THEN
    RAISE EXCEPTION 'campo_personalizado_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  -- 2. Strip the JSONB key from every row of the matching entity table.
  --    The `?` operator short-circuits rows that don't hold the key so
  --    we only write rows that actually need rewriting.
  IF v_entidad = 'empresa' THEN
    UPDATE empresas
       SET campos_personalizados = campos_personalizados - v_clave
     WHERE campos_personalizados ? v_clave;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
  ELSIF v_entidad = 'contacto' THEN
    UPDATE contactos
       SET campos_personalizados = campos_personalizados - v_clave
     WHERE campos_personalizados ? v_clave;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
  ELSIF v_entidad = 'deal' THEN
    UPDATE deals
       SET campos_personalizados = campos_personalizados - v_clave
     WHERE campos_personalizados ? v_clave;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
  END IF;

  -- 3. Delete the definition row. Wrapped in the same plpgsql block so
  --    PostgreSQL runs the whole function inside a single transaction —
  --    any error in step 2 rolls back step 3 automatically.
  DELETE FROM campos_personalizados WHERE id = p_id;

  RETURN v_rows;
END;
$$;

-- Lock the function down: only authenticated admins (enforced by RLS on
-- the tables it touches, since SECURITY INVOKER runs as the caller).
REVOKE EXECUTE ON FUNCTION public.delete_campo_personalizado(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.delete_campo_personalizado(UUID) TO authenticated;
