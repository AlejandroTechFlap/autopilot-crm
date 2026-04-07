import { createClient } from '@/lib/supabase/server';
import { requireAuth, hasRole } from '@/lib/auth';
import { PipelineClient } from './client';

export default async function PipelinePage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get the first pipeline (MVP has one pipeline)
  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('id')
    .order('created_at')
    .limit(1)
    .single();

  if (!pipeline) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No se encontró ningún pipeline. Ejecuta el script de seed.
      </div>
    );
  }

  // Only fetch the vendedores list for admin/direccion — they're the only
  // roles that can create leads, and we don't want to leak the full seller
  // list into a vendedor's bundle.
  const canCreateLead = hasRole(user, 'admin', 'direccion');
  let vendedores: { id: string; nombre: string }[] = [];
  if (canCreateLead) {
    const { data } = await supabase
      .from('usuarios')
      .select('id, nombre')
      .eq('rol', 'vendedor')
      .order('nombre');
    vendedores = data ?? [];
  }

  return (
    <PipelineClient
      pipelineId={pipeline.id}
      canCreateLead={canCreateLead}
      vendedores={vendedores}
    />
  );
}
