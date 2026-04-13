import { describe, it, expect } from 'vitest';
import { validateSql, MAX_QUERY_ROWS, QUERY_TIMEOUT_S } from './sql-validator';

describe('validateSql', () => {
  describe('constants', () => {
    it('exports MAX_QUERY_ROWS as 200', () => {
      expect(MAX_QUERY_ROWS).toBe(200);
    });

    it('exports QUERY_TIMEOUT_S as 5', () => {
      expect(QUERY_TIMEOUT_S).toBe(5);
    });
  });

  describe('structural validation', () => {
    it('rejects empty string', () => {
      expect(validateSql('')).toEqual({ valid: false, error: 'Query is empty' });
    });

    it('rejects whitespace-only string', () => {
      expect(validateSql('   ')).toEqual({ valid: false, error: 'Query is empty' });
    });

    it('strips trailing semicolons and accepts the query', () => {
      const r = validateSql('SELECT 1;');
      expect(r.valid).toBe(true);
      expect(r.normalizedSql).toContain('SELECT 1');
    });

    it('rejects mid-query semicolons (multiple statements)', () => {
      const r = validateSql('SELECT 1; SELECT 2');
      expect(r.valid).toBe(false);
      expect(r.error).toContain('Multiple statements');
    });

    it('rejects non-SELECT queries (INSERT)', () => {
      const r = validateSql('INSERT INTO t VALUES (1)');
      expect(r.valid).toBe(false);
      expect(r.error).toContain('Only SELECT');
    });

    it('rejects non-SELECT queries (WITH)', () => {
      const r = validateSql('WITH cte AS (SELECT 1) SELECT * FROM cte');
      expect(r.valid).toBe(false);
      expect(r.error).toContain('Only SELECT');
    });

    it('accepts valid SELECT (case-insensitive)', () => {
      const r = validateSql('select * from empresas');
      expect(r.valid).toBe(true);
    });

    it('returns normalizedSql on success, not on failure', () => {
      const ok = validateSql('SELECT 1');
      expect(ok.normalizedSql).toBeDefined();

      const fail = validateSql('');
      expect(fail.normalizedSql).toBeUndefined();
    });
  });

  describe('forbidden keywords', () => {
    const FORBIDDEN = [
      'insert', 'update', 'delete', 'drop', 'alter', 'truncate',
      'create', 'grant', 'revoke', 'copy', 'execute', 'call',
      'lock', 'listen', 'notify', 'vacuum', 'analyze',
      'begin', 'commit', 'rollback', 'savepoint',
    ];

    it.each(FORBIDDEN)('rejects query containing forbidden keyword: %s', (kw) => {
      const r = validateSql(`SELECT * FROM t WHERE ${kw} = 1`);
      expect(r.valid).toBe(false);
      expect(r.error).toContain(kw.toUpperCase());
    });

    it('detects keywords case-insensitively', () => {
      const r = validateSql('SELECT * FROM t WHERE DELETE = 1');
      expect(r.valid).toBe(false);
    });

    it('does not flag keyword as substring (e.g. "updated_at")', () => {
      const r = validateSql('SELECT updated_at FROM empresas');
      expect(r.valid).toBe(true);
    });

    it('does not flag "selectors" as "select"', () => {
      // "select" is not in FORBIDDEN, but this tests word-boundary behavior
      const r = validateSql('SELECT * FROM selectors');
      expect(r.valid).toBe(true);
    });
  });

  describe('blocked schemas', () => {
    const BLOCKED = [
      'auth.', 'pg_catalog', 'pg_stat', 'information_schema',
      'supabase_', 'storage.', 'realtime.', 'extensions.',
    ];

    it.each(BLOCKED)('rejects query referencing blocked schema: %s', (schema) => {
      const r = validateSql(`SELECT * FROM ${schema}users`);
      expect(r.valid).toBe(false);
      expect(r.error).toContain(schema);
    });
  });

  describe('SET ROLE / SET SESSION', () => {
    it('rejects SET ROLE', () => {
      const r = validateSql('SELECT set role admin');
      expect(r.valid).toBe(false);
      expect(r.error).toContain('SET ROLE/SESSION');
    });

    it('rejects SET SESSION', () => {
      const r = validateSql('SELECT set session authorization');
      expect(r.valid).toBe(false);
      expect(r.error).toContain('SET ROLE/SESSION');
    });
  });

  describe('LIMIT handling', () => {
    it('appends LIMIT 200 when not present', () => {
      const r = validateSql('SELECT * FROM empresas');
      expect(r.valid).toBe(true);
      expect(r.normalizedSql).toBe('SELECT * FROM empresas LIMIT 200');
    });

    it('preserves existing LIMIT clause', () => {
      const r = validateSql('SELECT * FROM empresas LIMIT 10');
      expect(r.valid).toBe(true);
      expect(r.normalizedSql).toBe('SELECT * FROM empresas LIMIT 10');
    });

    it('preserves case-insensitive LIMIT', () => {
      const r = validateSql('SELECT * FROM empresas limit 50');
      expect(r.valid).toBe(true);
      expect(r.normalizedSql).toBe('SELECT * FROM empresas limit 50');
    });
  });

  describe('injection attempts', () => {
    it('rejects subquery containing DROP', () => {
      const r = validateSql('SELECT (SELECT drop FROM t)');
      expect(r.valid).toBe(false);
    });

    it('rejects UNION with DELETE', () => {
      const r = validateSql('SELECT 1 UNION DELETE FROM t');
      expect(r.valid).toBe(false);
    });
  });
});
