/**
 * GET /api/chat/summary
 *
 * Daily morning briefing. Role-aware so dirección/admin no longer get a
 * vendedor-shaped narrative ("tú gestionas 8 negocios" with team-wide
 * numbers — Alejandro reported this on 2026-04-07 with Rebeca).
 *
 * Strategy: skip the full tool-call loop (we know exactly which KPIs we
 * need for a briefing). Run the role-appropriate KPI fetch directly,
 * inject the real numbers into a tight prompt, single generateContent
 * call. Keeps the cockpit snappy (~1 model call instead of N).
 *
 * Cached per (user, fecha) in `briefings_diarios` — same contract as
 * before, so the front-end (`useMorningSummary`) is unchanged.
 */

import type { NextRequest } from 'next/server';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { assertFeatureFlag } from '@/features/tenant/lib/feature-flag-guard';
import { getClient, getModel, buildRoleContext } from '@/features/ai-chat/lib/gemini';
import { getKpisVendedor, getKpisDireccion } from '@/features/ai-chat/lib/tools/kpis';
import {
  generateWithRetry,
  mapGeminiErrorToUserMessage,
} from '@/features/ai-chat/lib/retry';

const SCOPE = 'api.chat.summary';

/** Local YYYY-MM-DD (Europe/Madrid is the only deployment locale). */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const fmtEur = (n: number) => `${n.toLocaleString('es-ES')} €`;

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const blocked = await assertFeatureFlag('feat_morning_summary');
  if (blocked) return blocked;

  const limit = rateLimit(`ai:summary:${user.id}`, 5, 60_000);
  if (!limit.ok) return rateLimitResponse(limit);

  const refresh = request.nextUrl.searchParams.get('refresh') === '1';
  const fecha = todayISO();
  const supabase = await createClient();

  // 1. Cache hit unless caller asked for a forced refresh.
  if (!refresh) {
    const { data: cached } = await supabase
      .from('briefings_diarios')
      .select('contenido, generated_at')
      .eq('user_id', user.id)
      .eq('fecha', fecha)
      .maybeSingle();

    if (cached) {
      logger.info({ scope: SCOPE, event: 'cache_hit', userId: user.id });
      return Response.json({
        summary: cached.contenido,
        generated_at: cached.generated_at,
        cached: true,
      });
    }
  }

  const startedAt = Date.now();
  try {
    const ctx = await buildRoleContext(user);
    const ai = getClient();
    const model = getModel();

    const prompt = await buildBriefingPrompt(user, ctx.userName, supabase);

    const response = await generateWithRetry(
      () =>
        ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            maxOutputTokens: 512,
            temperature: 0.6,
          },
        }),
      {
        onRetry: (attempt, retryErr) =>
          logger.warn({
            scope: SCOPE,
            event: 'gemini_retry',
            userId: user.id,
            attempt,
            err: retryErr,
          }),
      },
    );

    const summary = response.text ?? 'No se ha podido generar el resumen.';
    const generatedAt = new Date().toISOString();

    // Persist as today's briefing — overwrite if a row already exists
    // (this branch runs both on first generation and on forced refresh).
    const { error: upsertError } = await supabase
      .from('briefings_diarios')
      .upsert(
        {
          user_id: user.id,
          fecha,
          contenido: summary,
          generated_at: generatedAt,
        },
        { onConflict: 'user_id,fecha' }
      );

    if (upsertError) {
      logger.error({ scope: SCOPE, event: 'cache_write_failed', err: upsertError });
    }

    logger.info({
      scope: SCOPE,
      event: 'success',
      userId: user.id,
      role: user.rol,
      refresh,
      durationMs: Date.now() - startedAt,
    });

    return Response.json({
      summary,
      generated_at: generatedAt,
      cached: false,
    });
  } catch (err) {
    logger.error({
      scope: SCOPE,
      event: 'failed',
      userId: user.id,
      durationMs: Date.now() - startedAt,
      err,
    });
    return jsonError(mapGeminiErrorToUserMessage(err), 500);
  }
}

/**
 * Build the role-specific prompt with REAL numbers pre-fetched. The model
 * receives plain text — no tools, no loop — so the briefing is grounded
 * in current data without burning multiple round-trips.
 */
async function buildBriefingPrompt(
  user: ApiUser,
  userName: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  if (user.rol === 'vendedor') {
    const { kpis } = await getKpisVendedor({}, supabase, user);
    return `Eres el coach de ventas de AutopilotCRM. Genera un briefing matutino para el vendedor ${userName}.

Datos REALES de su cartera (úsalos textualmente, no los inventes):
- Negocios abiertos: ${kpis.deals_abiertos} (valor del embudo: ${fmtEur(kpis.valor_pipeline)})
- Tareas pendientes: ${kpis.tareas_pendientes} (de las cuales ${kpis.tareas_vencidas} VENCIDAS)
- Actividades registradas hoy: ${kpis.actividades_hoy}
- Negocios ganados este mes: ${kpis.deals_ganados_mes} (${fmtEur(kpis.valor_ganado_mes)})
- Comisión generada este mes: ${fmtEur(kpis.comision_mes)}

Redacta un briefing de 3-5 viñetas en MARKDOWN cubriendo:
1. Estado del embudo personal en una línea
2. Lo más urgente (tareas vencidas, deals que merecen atención HOY)
3. Una recomendación concreta y accionable para el día

Tono cercano, motivador pero honesto. Tutea. Máximo 150 palabras. Responde SIEMPRE en español.`;
  }

  if (user.rol === 'direccion' || user.rol === 'admin') {
    const { kpis, por_vendedor } = await getKpisDireccion({ periodo: 'month' }, supabase);
    const topVendedores = [...por_vendedor]
      .sort((a, b) => b.deals_ganados - a.deals_ganados)
      .slice(0, 3)
      .map((v) => `${v.vendedor.nombre} (${v.deals_ganados} ganados, ${fmtEur(v.valor_pipeline)} en embudo)`)
      .join('; ');

    const roleLabel = user.rol === 'direccion' ? 'la dirección comercial' : 'el administrador';

    return `Eres el coach de desempeño de AutopilotCRM. Genera un briefing matutino para ${roleLabel} (${userName}).

Datos REALES del EQUIPO este mes (úsalos textualmente, son cifras de equipo, NO personales):
- Embudo total del equipo: ${fmtEur(kpis.total_pipeline_value)} en ${kpis.deals_abiertos} negocios abiertos
- Cerrados este mes: ${kpis.deals_ganados} ganados (${fmtEur(kpis.valor_ganado)}) vs ${kpis.deals_perdidos} perdidos
- Tasa de conversión del equipo: ${kpis.tasa_conversion}%
- Ticket medio: ${fmtEur(kpis.ticket_medio)}
- Actividades del equipo este mes: ${kpis.actividades_periodo}
- Tareas vencidas a nivel equipo: ${kpis.tareas_vencidas}
- Top 3 vendedores por cierres del mes: ${topVendedores || 'sin datos'}

Redacta un briefing de 3-5 viñetas en MARKDOWN cubriendo:
1. Salud del equipo en una línea (sin atribuir cifras al usuario como si fueran suyas)
2. Riesgos a vigilar HOY (tareas vencidas del equipo, conversión baja, etc.)
3. Una recomendación de gestión concreta (a quién dar coaching, qué deal inspeccionar, etc.)

Habla siempre del EQUIPO, nunca digas "tú gestionas X negocios". Tutea al lector.
Tono ejecutivo y directo. Máximo 150 palabras. Responde SIEMPRE en español.`;
  }

  // Exhaustive guard — should be unreachable.
  return `Genera un breve saludo en español para ${userName}.`;
}
