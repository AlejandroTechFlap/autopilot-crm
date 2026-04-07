import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import { calculateSemaphore } from '@/features/pipeline/lib/semaphore';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const { id: pipelineId } = await params;
  const supabase = await createClient();

  // Fetch pipeline
  const { data: pipeline, error: pipelineError } = await supabase
    .from('pipelines')
    .select('id, nombre')
    .eq('id', pipelineId)
    .single();

  if (pipelineError || !pipeline) {
    return jsonError('Pipeline not found', 404);
  }

  // Fetch phases ordered
  const { data: fases } = await supabase
    .from('fases')
    .select('id, nombre, orden, tiempo_esperado')
    .eq('pipeline_id', pipelineId)
    .order('orden');

  if (!fases) {
    return jsonError('Failed to load phases', 500);
  }

  // Fetch open deals (not closed) for this pipeline
  let dealsQuery = supabase
    .from('deals')
    .select(`
      id, valor, fecha_entrada_fase, fase_actual, resultado, motivo_perdida, cerrado_en, created_at,
      empresa:empresas!deals_empresa_id_fkey(id, nombre, fuente_lead, proxima_accion, proxima_accion_fecha, lifecycle_stage),
      vendedor:usuarios!deals_vendedor_asignado_fkey(id, nombre)
    `)
    .eq('pipeline_id', pipelineId);

  // Vendedores only see their own deals
  if (user.rol === 'vendedor') {
    dealsQuery = dealsQuery.eq('vendedor_asignado', user.id);
  }

  const { data: deals, error: dealsError } = await dealsQuery;

  if (dealsError) {
    return jsonError('Failed to load deals', 500);
  }

  // Build phase map with tiempo_esperado
  const tiempoMap = new Map(
    fases.map((f) => [f.id, f.tiempo_esperado])
  );

  // Group deals by phase and add semaphore
  const now = new Date();
  const dealsByPhase = new Map<string, typeof enrichedDeals>();

  type EnrichedDeal = (typeof deals)[number] & {
    semaphore: string;
    days_in_phase: number;
    semaphore_pct: number;
  };
  const enrichedDeals: EnrichedDeal[] = [];

  for (const deal of deals ?? []) {
    const tiempo = tiempoMap.get(deal.fase_actual) ?? null;
    const sem = calculateSemaphore(deal.fecha_entrada_fase, tiempo, now);

    const enriched = {
      ...deal,
      semaphore: sem.color,
      days_in_phase: sem.daysInPhase,
      semaphore_pct: sem.percentage,
    };

    enrichedDeals.push(enriched);

    const phaseDeals = dealsByPhase.get(deal.fase_actual) ?? [];
    phaseDeals.push(enriched);
    dealsByPhase.set(deal.fase_actual, phaseDeals);
  }

  // Build response
  const fasesWithDeals = fases.map((fase) => ({
    ...fase,
    deals: dealsByPhase.get(fase.id) ?? [],
  }));

  return Response.json({ pipeline, fases: fasesWithDeals });
}
