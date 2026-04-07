/**
 * Shared base context loaded for every role. Lightweight by design — heavy
 * KPI numbers belong in tools that the model invokes on demand, not in the
 * system prompt. Base only carries identity (who is asking, what role, what
 * day is it) so the role-specific prompts can frame their tone correctly.
 */

import { createClient } from '@/lib/supabase/server';
import type { ApiUser } from '@/lib/api-utils';

export interface BaseContext {
  userId: string;
  userName: string;
  userRole: 'vendedor' | 'direccion' | 'admin';
  /** Localized label used inside the system prompt. */
  roleLabel: string;
  /** "lunes, 7 de abril de 2026" — full Spanish date for the model. */
  today: string;
}

const ROLE_LABEL: Record<'vendedor' | 'direccion' | 'admin', string> = {
  vendedor: 'vendedor',
  direccion: 'dirección comercial',
  admin: 'administrador',
};

export async function buildBaseContext(user: ApiUser): Promise<BaseContext> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('usuarios')
    .select('nombre')
    .eq('id', user.id)
    .maybeSingle();

  const userName = data?.nombre ?? 'usuario';
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    userId: user.id,
    userName,
    userRole: user.rol,
    roleLabel: ROLE_LABEL[user.rol],
    today,
  };
}
