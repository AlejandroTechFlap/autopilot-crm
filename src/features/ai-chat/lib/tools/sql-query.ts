/**
 * AI tool: query_database
 *
 * Allows the AI to execute validated SELECT queries against the CRM
 * database. SQL is validated in TypeScript (defense-in-depth) and then
 * executed via the `execute_readonly_query` Postgres RPC function, which
 * runs as SECURITY INVOKER — the user's RLS policies apply.
 *
 * Phase 11: AI Data Analytics & Interactive Visualization.
 */

import { z } from 'zod/v4';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { validateSql, MAX_QUERY_ROWS } from './sql-validator';

type Supabase = SupabaseClient<Database>;

export const QueryDatabaseSchema = z.object({
  sql: z.string().min(1).max(4000),
  title: z.string().max(200).optional(),
});

export type QueryDatabaseInput = z.infer<typeof QueryDatabaseSchema>;

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncated: boolean;
  title?: string;
  sql: string;
}

export async function queryDatabase(
  input: QueryDatabaseInput,
  supabase: Supabase,
): Promise<QueryResult | { error: string }> {
  // 1. Validate SQL in TypeScript (first layer)
  const validation = validateSql(input.sql);
  if (!validation.valid) {
    return { error: `SQL validation failed: ${validation.error}` };
  }

  const safeSql = validation.normalizedSql!;

  try {
    // 2. Execute via RPC (Postgres validates again + applies RLS)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPC not in generated types yet
    const { data, error } = await (supabase.rpc as any)('execute_readonly_query', {
      query_text: safeSql,
      max_rows: MAX_QUERY_ROWS,
    });

    if (error) {
      // Clean up Postgres error messages for the AI
      const msg = error.message
        .replace(/^ERR_\w+:\s*/, '')
        .replace(/\bcontext:.*$/i, '')
        .trim();
      return { error: `Query execution error: ${msg}` };
    }

    // 3. Parse result — RPC returns jsonb (array of objects)
    const rows: Record<string, unknown>[] = Array.isArray(data) ? data : [];
    const columns =
      rows.length > 0 ? Object.keys(rows[0]) : [];
    const truncated = rows.length >= MAX_QUERY_ROWS;

    return {
      columns,
      rows,
      rowCount: rows.length,
      truncated,
      title: input.title,
      sql: safeSql,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown execution error';
    return { error: `Query failed: ${msg}` };
  }
}
