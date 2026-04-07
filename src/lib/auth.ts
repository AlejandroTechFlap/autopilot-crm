import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Database } from '@/types/database';

type RolUsuario = Database['public']['Enums']['rol_usuario'];

export interface CrmUser {
  id: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  avatar_url: string | null;
}

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

export function hasRole(user: CrmUser, ...roles: RolUsuario[]): boolean {
  return roles.includes(user.rol);
}
