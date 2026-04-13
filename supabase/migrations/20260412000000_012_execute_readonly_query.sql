-- Phase 11: AI Analytics — read-only SQL execution function.
--
-- Called via supabase.rpc('execute_readonly_query', { query_text, max_rows })
-- from the AI chat's query_database tool. Runs as SECURITY INVOKER so RLS
-- policies apply based on the calling user's JWT — a vendedor can only see
-- their own data even if the AI generates a broader query.
--
-- Defense-in-depth: TypeScript validates the SQL before it reaches here.
-- This function adds a second validation layer at the Postgres level.

CREATE OR REPLACE FUNCTION public.execute_readonly_query(
  query_text text,
  max_rows integer DEFAULT 200
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET statement_timeout = '5s'
AS $$
DECLARE
  result jsonb;
  normalized text;
  limited_query text;
BEGIN
  -- Normalize for pattern matching
  normalized := lower(trim(query_text));

  -- 1. Must start with SELECT
  IF NOT (normalized LIKE 'select %' OR normalized LIKE 'select\n%' OR normalized = 'select') THEN
    RAISE EXCEPTION 'ERR_NOT_SELECT: Only SELECT queries are allowed';
  END IF;

  -- 2. Block DML/DDL keywords
  IF normalized ~ '\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy)\b' THEN
    RAISE EXCEPTION 'ERR_FORBIDDEN_KEYWORD: Query contains forbidden keywords';
  END IF;

  -- 3. Block system schema access
  IF normalized ~ '(auth\.|pg_catalog|pg_stat|information_schema|supabase_)' THEN
    RAISE EXCEPTION 'ERR_SYSTEM_SCHEMA: Access to system schemas is not allowed';
  END IF;

  -- 4. Block transaction control
  IF normalized ~ '\b(begin|commit|rollback|savepoint|set\s+role|set\s+session|reset\s+role)\b' THEN
    RAISE EXCEPTION 'ERR_TX_CONTROL: Transaction control statements are not allowed';
  END IF;

  -- 5. Enforce row limit — append LIMIT if not present
  IF NOT normalized ~ '\blimit\s+\d+' THEN
    limited_query := trim(trailing ';' from trim(query_text)) || ' LIMIT ' || max_rows;
  ELSE
    limited_query := trim(trailing ';' from trim(query_text));
  END IF;

  -- 6. Execute and return as JSONB array of objects
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t.*)), ''[]''::jsonb) FROM (%s) AS t',
    limited_query
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute to authenticated users (RLS enforces row-level access)
GRANT EXECUTE ON FUNCTION public.execute_readonly_query(text, integer) TO authenticated;

COMMENT ON FUNCTION public.execute_readonly_query IS
  'AI Analytics: executes a validated SELECT query with RLS enforcement. '
  'Called by the AI chat query_database tool. SECURITY INVOKER — runs as '
  'the calling user so RLS policies apply.';
