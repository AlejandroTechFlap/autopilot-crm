/**
 * Vendedor framing — no extra fields beyond `BaseContext`. Everything the
 * sales coach needs comes from tool calls (RLS-scoped to the vendedor) so
 * there is nothing to pre-fetch here. The discriminated `kind` field exists
 * so the prompt dispatcher can match on a literal type.
 */

import type { ApiUser } from '@/lib/api-utils';
import { buildBaseContext, type BaseContext } from './base';

export interface VendedorContext extends BaseContext {
  kind: 'vendedor';
  userRole: 'vendedor';
}

export async function buildVendedorContext(user: ApiUser): Promise<VendedorContext> {
  const base = await buildBaseContext(user);
  return { ...base, kind: 'vendedor', userRole: 'vendedor' };
}
