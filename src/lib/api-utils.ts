import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type RolUsuario = Database['public']['Enums']['rol_usuario'];

export interface ApiUser {
  id: string;
  rol: RolUsuario;
}

/**
 * Authenticate the request and return the current user's id and role.
 * Returns null if not authenticated.
 */
export async function getApiUser(): Promise<ApiUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('usuarios')
    .select('id, rol')
    .eq('id', user.id)
    .single();

  if (!data) return null;
  return data;
}

/**
 * Require authentication for an API route. Returns 401 Response if not authenticated.
 */
export async function requireApiAuth(): Promise<ApiUser | Response> {
  const user = await getApiUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return user;
}

/**
 * Require authentication AND that the user holds one of the given roles.
 * Returns 401 if not authenticated, 403 if authenticated but lacking the role.
 *
 * Use this for endpoints that should be accessible to a subset of roles wider
 * than admin alone (e.g. admin + direccion). For admin-only endpoints prefer
 * `requireAdmin()` from `@/features/admin/lib/admin-guard`.
 */
export async function requireApiRole(
  ...roles: RolUsuario[]
): Promise<ApiUser | Response> {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  if (!roles.includes(auth.rol)) {
    return jsonError('Forbidden: insufficient role', 403);
  }
  return auth;
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
