import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { CrmUser, RolUsuario } from './auth-client';

// Re-export the client-safe symbols so existing server-side imports that
// reach for `@/lib/auth` keep working. Client components MUST import from
// `@/lib/auth-client` directly to avoid pulling `next/headers` into the
// browser bundle (see `./auth-client.ts` for context).
export { hasRole, type CrmUser, type RolUsuario } from './auth-client';

export async function getCurrentUser(): Promise<CrmUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, email, nombre, rol, avatar_url')
    .eq('id', user.id)
    .single();

  if (!usuario) return null;
  return usuario;
}

export async function requireAuth(): Promise<CrmUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(...roles: RolUsuario[]): Promise<CrmUser> {
  const user = await requireAuth();
  if (!roles.includes(user.rol)) redirect('/');
  return user;
}

