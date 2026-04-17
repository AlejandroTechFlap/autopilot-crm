/**
 * Per-role tool declaration scoping (PoLP — Principle of Least Privilege).
 *
 * Inspired by Salesforce Agentforce's permission-set-driven action access:
 * each role only sees the function declarations it is allowed to invoke.
 * The dispatch layer + Postgres RLS still guard at runtime — this is a
 * model-facing layer that prevents wasted turns and accidental exposure of
 * tool names that would only return errors.
 */

import type { FunctionDeclaration } from '@google/genai';

export type Rol = 'vendedor' | 'direccion' | 'admin';

/** Tools that vendedor cannot invoke (dispatch already returns forbidden). */
const VENDEDOR_HIDDEN: ReadonlySet<string> = new Set(['get_kpis_direccion']);

export function filterToolsForRole(
  declarations: FunctionDeclaration[],
  rol: Rol | string,
): FunctionDeclaration[] {
  if (rol === 'vendedor') {
    return declarations.filter((d) => !VENDEDOR_HIDDEN.has(d.name ?? ''));
  }
  return declarations;
}
