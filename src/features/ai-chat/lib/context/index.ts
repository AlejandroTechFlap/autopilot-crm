/**
 * Role-context dispatcher. Returns a discriminated union so downstream code
 * (the prompt builders) can `switch` on `kind` for type-safe specialisation.
 */

import type { ApiUser } from '@/lib/api-utils';
import { buildVendedorContext, type VendedorContext } from './vendedor';
import { buildDireccionContext, type DireccionContext } from './direccion';
import { buildAdminContext, type AdminContext } from './admin';

export type RoleContext = VendedorContext | DireccionContext | AdminContext;
export type { VendedorContext, DireccionContext, AdminContext };
export type { BaseContext } from './base';

export async function buildRoleContext(user: ApiUser): Promise<RoleContext> {
  switch (user.rol) {
    case 'vendedor':
      return buildVendedorContext(user);
    case 'direccion':
      return buildDireccionContext(user);
    case 'admin':
      return buildAdminContext(user);
  }
}
