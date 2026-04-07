/**
 * Role-prompt dispatcher. Uses the discriminated `kind` from the
 * role context so each branch is type-narrowed to its own context
 * shape — no casts, no `any`.
 */

import type { RoleContext } from '../context';
import { buildVendedorPrompt } from './vendedor';
import { buildDireccionPrompt } from './direccion';
import { buildAdminPrompt } from './admin';

export { DB_SCHEMA_SUMMARY } from './schema';
export { buildVendedorPrompt } from './vendedor';
export { buildDireccionPrompt } from './direccion';
export { buildAdminPrompt } from './admin';

export function buildRolePrompt(ctx: RoleContext): string {
  switch (ctx.kind) {
    case 'vendedor':
      return buildVendedorPrompt(ctx);
    case 'direccion':
      return buildDireccionPrompt(ctx);
    case 'admin':
      return buildAdminPrompt(ctx);
  }
}
