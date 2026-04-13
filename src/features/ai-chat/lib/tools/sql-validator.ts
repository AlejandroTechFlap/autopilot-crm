/**
 * SQL validation for the AI query_database tool.
 *
 * Defense-in-depth: validates BEFORE the query reaches Postgres. The RPC
 * function `execute_readonly_query` has its own validation layer, but
 * catching bad queries here avoids a round-trip and provides clearer
 * error messages to the AI model.
 */

/** Maximum rows the query can return. */
export const MAX_QUERY_ROWS = 200;

/** Statement timeout in seconds (matches the Postgres function). */
export const QUERY_TIMEOUT_S = 5;

/** Keywords that indicate a write/DDL operation. */
const FORBIDDEN_KEYWORDS = [
  'insert',
  'update',
  'delete',
  'drop',
  'alter',
  'truncate',
  'create',
  'grant',
  'revoke',
  'copy',
  'execute',
  'call',
  'lock',
  'listen',
  'notify',
  'vacuum',
  'analyze',
  'begin',
  'commit',
  'rollback',
  'savepoint',
];

/** Schema prefixes that must not appear in queries. */
const BLOCKED_SCHEMAS = [
  'auth.',
  'pg_catalog',
  'pg_stat',
  'information_schema',
  'supabase_',
  'storage.',
  'realtime.',
  'extensions.',
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  /** The SQL with LIMIT appended if it was missing. */
  normalizedSql?: string;
}

/**
 * Validates a SQL string for safe read-only execution.
 *
 * Rules:
 * 1. Must be a single statement (no semicolons mid-query)
 * 2. Must start with SELECT (case-insensitive)
 * 3. No DML/DDL keywords
 * 4. No system schema access
 * 5. No transaction control (SET ROLE, etc.)
 * 6. Appends LIMIT if missing
 */
export function validateSql(sql: string): ValidationResult {
  const trimmed = sql.trim();

  if (!trimmed) {
    return { valid: false, error: 'Query is empty' };
  }

  // Remove trailing semicolons
  const cleaned = trimmed.replace(/;\s*$/, '');

  // 1. No multiple statements (semicolons within the query)
  if (cleaned.includes(';')) {
    return { valid: false, error: 'Multiple statements are not allowed' };
  }

  // 2. Must start with SELECT
  const lower = cleaned.toLowerCase();
  if (!lower.startsWith('select')) {
    return { valid: false, error: 'Only SELECT queries are allowed' };
  }

  // 3. Check for forbidden keywords (whole word match)
  for (const kw of FORBIDDEN_KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    if (regex.test(cleaned)) {
      return { valid: false, error: `Forbidden keyword: ${kw.toUpperCase()}` };
    }
  }

  // 4. Check for system schema access
  for (const schema of BLOCKED_SCHEMAS) {
    if (lower.includes(schema)) {
      return {
        valid: false,
        error: `Access to system schema "${schema}" is not allowed`,
      };
    }
  }

  // 5. Check for SET ROLE / SET SESSION
  if (/\bset\s+(role|session)\b/i.test(cleaned)) {
    return {
      valid: false,
      error: 'SET ROLE/SESSION statements are not allowed',
    };
  }

  // 6. Append LIMIT if not present
  let normalizedSql = cleaned;
  if (!/\blimit\s+\d+/i.test(cleaned)) {
    normalizedSql = `${cleaned} LIMIT ${MAX_QUERY_ROWS}`;
  }

  return { valid: true, normalizedSql };
}
