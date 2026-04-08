/**
 * Client-safe auth primitives.
 *
 * This module contains ONLY pure types and functions so that `'use client'`
 * components can import it without pulling `next/headers` (via supabase/server)
 * into the client bundle. Next.js 16 / Turbopack enforce the server/client
 * module boundary strictly at build time, so any symbol needed by a client
 * component must live here — not in `./auth.ts`.
 *
 * See `docs/gap-analysis.md` §13 for the production-readiness audit that
 * introduced this split.
 */
import type { Database } from '@/types/database';

export type RolUsuario = Database['public']['Enums']['rol_usuario'];

export interface CrmUser {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  avatar_url: string | null;
}

/** Pure role check — safe to import from client components. */
export function hasRole(user: CrmUser, ...roles: RolUsuario[]): boolean {
  return roles.includes(user.rol);
}
