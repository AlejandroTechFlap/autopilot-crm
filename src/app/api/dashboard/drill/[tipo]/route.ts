import { createClient } from '@/lib/supabase/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import type { NextRequest } from 'next/server';
import { buildDrill } from '@/features/dashboard/lib/drill';
import type { DrillType } from '@/features/dashboard/types';
import { logger } from '@/lib/logger';

const VALID_TIPOS: DrillType[] = [
  'pipeline_value',
  'deals_ganados',
  'conversion',
  'ticket_medio',
  'tareas_vencidas',
];

function isDrillType(value: string): value is DrillType {
  return (VALID_TIPOS as string[]).includes(value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tipo: string }> }
) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  if (user.rol === 'vendedor') {
    return jsonError('Forbidden', 403);
  }

  const { tipo } = await params;
  if (!isDrillType(tipo)) {
    return jsonError(`Unknown drill type: ${tipo}`, 400);
  }

  const periodo = request.nextUrl.searchParams.get('periodo') ?? 'month';
  const supabase = await createClient();

  try {
    const drill = await buildDrill(supabase, tipo, periodo);
    return Response.json(drill);
  } catch (err) {
    logger.error({ scope: 'api.dashboard.drill', event: 'failed', err });
    return jsonError('Failed to build drill data', 500);
  }
}
