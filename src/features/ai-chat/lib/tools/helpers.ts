/**
 * Shared constants and helpers used by every AI tool implementation.
 *
 * Tools are exposed to Gemini via function calling. Each tool runs with the
 * authenticated user's Supabase session, so RLS is the source of truth for
 * what the model can read. These helpers exist to keep individual tool files
 * tight (≤ 200 lines per CLAUDE.md rule #2) and to centralise the security
 * caps that protect token budget and prevent runaway loops.
 */

/** Hard cap on the `limit` parameter every search tool accepts. */
export const MAX_LIMIT = 20;

/** Default limit when the model omits it. */
export const DEFAULT_LIMIT = 10;

/**
 * Maximum number of tool-call turns per user message.
 *
 * Sized for Phase 11 analytics flows: a typical dirección question can chain
 * `get_kpis_direccion` → `query_database` → `render_chart` → `render_table`
 * plus 1–3 SQL retries before producing the final text. 8 leaves room for that
 * pattern; HubSpot Breeze and Salesforce Agentforce use comparable budgets.
 */
export const MAX_TURNS = 8;

/** Cap on script `contenido` length returned by `get_script` (chars). */
export const MAX_SCRIPT_CONTENT = 5000;

/**
 * Clamps a user-supplied limit to `[1, MAX_LIMIT]`.
 * Falls back to `DEFAULT_LIMIT` when the input is missing or invalid.
 */
export function clampLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

/**
 * Splits `query` by whitespace, escapes Supabase `.or()` reserved characters,
 * and returns an `.or()`-compatible filter string that ilike-matches every
 * term against `column`.
 *
 * Example:
 *   buildFuzzyOr('nombre', 'Coca Col')
 *     → 'nombre.ilike.%Coca%,nombre.ilike.%Col%'
 *
 * Use with: supabase.from(...).or(buildFuzzyOr('nombre', q))
 *
 * Note: terms shorter than 2 chars are dropped to avoid matching everything.
 * Returns an empty string when no usable terms remain — callers should treat
 * empty string as "no filter".
 */
export function buildFuzzyOr(column: string, query: string): string {
  const terms = query
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .map((t) => sanitizeOrTerm(t));

  if (terms.length === 0) return '';
  return terms.map((t) => `${column}.ilike.%${t}%`).join(',');
}

/**
 * Same as `buildFuzzyOr` but matches `query` against multiple columns.
 * Each column gets its own ilike condition for every term.
 */
export function buildFuzzyOrMulti(columns: string[], query: string): string {
  const terms = query
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .map((t) => sanitizeOrTerm(t));

  if (terms.length === 0) return '';
  const parts: string[] = [];
  for (const col of columns) {
    for (const t of terms) {
      parts.push(`${col}.ilike.%${t}%`);
    }
  }
  return parts.join(',');
}

/**
 * Strips characters that have special meaning inside a Supabase `.or()`
 * expression: comma (separator), parentheses (grouping), and percent
 * (we add it ourselves as the wildcard). Backslash-escapes single quotes.
 */
function sanitizeOrTerm(term: string): string {
  return term
    .replace(/[(),]/g, '')
    .replace(/%/g, '')
    .replace(/'/g, "''");
}

/**
 * Returns the start of "today" in the user's local time as an ISO string.
 * Used by tools that filter by "today", "this week", etc.
 */
export function todayStartIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

/** Returns the start of the current calendar month as ISO. */
export function monthStartIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/** Returns the period code used by `comisiones.periodo` (e.g. "2026-04"). */
export function currentPeriodCode(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Parses a small set of Spanish relative-date phrases into a Date.
 * Returns `null` if the phrase is unrecognised — callers can decide whether
 * to fall through to a literal date parse or ignore the filter.
 *
 * Recognised:
 *   "hoy"           → today 00:00
 *   "ayer"          → yesterday 00:00
 *   "esta semana"   → Monday of this week 00:00
 *   "este mes"      → first day of current month 00:00
 *   "ultimo mes"    → first day of previous month 00:00
 *   "ultimos 7 dias"→ now − 7 days
 *   "ultimos 30 dias" → now − 30 days
 */
export function parseRelativeDate(text: string): Date | null {
  const t = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const now = new Date();

  if (t === 'hoy') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (t === 'ayer') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  }
  if (t === 'esta semana') {
    const day = now.getDay(); // 0 = Sunday
    const offset = day === 0 ? -6 : 1 - day;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  }
  if (t === 'este mes') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (t === 'ultimo mes' || t === 'mes pasado') {
    return new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
  const lastNDays = t.match(/^ultimos?\s+(\d+)\s+dias?$/);
  if (lastNDays) {
    const n = parseInt(lastNDays[1], 10);
    return new Date(now.getTime() - n * 86_400_000);
  }
  return null;
}

/** Standard error envelope returned by tool dispatch. */
export interface ToolError {
  error: string;
}

/** Type guard for the error envelope. */
export function isToolError(value: unknown): value is ToolError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ToolError).error === 'string'
  );
}
