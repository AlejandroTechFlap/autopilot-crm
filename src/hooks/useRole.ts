'use client';

import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser-singleton';
import type { Database } from '@/types/database';

type RolUsuario = Database['public']['Enums']['rol_usuario'];

interface RoleState {
  rol: RolUsuario | null;
  nombre: string | null;
  loading: boolean;
}

export function useRole(): RoleState {
  const [state, setState] = useState<RoleState>({
    rol: null,
    nombre: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = getBrowserClient();
    let cancelled = false;

    async function fetchRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setState({ rol: null, nombre: null, loading: false });
        return;
      }

      const { data } = await supabase
        .from('usuarios')
        .select('rol, nombre')
        .eq('id', user.id)
        .single();
      if (cancelled) return;

      setState({
        rol: data?.rol ?? null,
        nombre: data?.nombre ?? null,
        loading: false,
      });
    }

    fetchRole();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
