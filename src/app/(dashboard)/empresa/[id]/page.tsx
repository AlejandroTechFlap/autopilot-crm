import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { EmpresaDetailClient } from './client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmpresaDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: empresa, error } = await supabase
    .from('empresas')
    .select(`
      *,
      vendedor:usuarios!empresas_vendedor_asignado_fkey(id, nombre, email),
      contactos(id, nombre_completo, cargo, telefono, email, es_principal),
      deals(id, valor, fase_actual, resultado, cerrado_en, fecha_entrada_fase, created_at,
        fase:fases!deals_fase_actual_fkey(nombre, tiempo_esperado))
    `)
    .eq('id', id)
    .single();

  if (error || !empresa) {
    notFound();
  }

  return <EmpresaDetailClient empresa={empresa} userId={user.id} />;
}
