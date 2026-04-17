/**
 * POST /api/ai/lead-extract
 *
 * Phase 12 — Captura inteligente de leads.
 *
 * Single-call Gemini extraction. The user pastes a free-form text (email
 * signature, LinkedIn copy, business card transcription, paragraph) and the
 * model returns a structured JSON with what it could extract, a confidence
 * score per field, missing fields and short follow-up questions for them.
 *
 * Role-gated to admin + direccion (vendedores cannot create leads — see
 * CLAUDE.md). Cached only at the model level — each call is a fresh extraction.
 */

import { z } from 'zod/v4';
import { requireApiRole, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import { logger } from '@/lib/logger';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { assertFeatureFlag } from '@/features/tenant/lib/feature-flag-guard';
import { getClient, getModel } from '@/features/ai-chat/lib/gemini';
import {
  buildLeadExtractPrompt,
  parseLeadExtractResponse,
  LeadFieldsSchema,
} from '@/features/ai-chat/lib/lead-extract';

const SCOPE = 'api.ai.lead-extract';

const RequestSchema = z.object({
  text: z.string().min(10).max(4000),
  currentData: LeadFieldsSchema.partial().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiRole('admin', 'direccion');
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const blocked = await assertFeatureFlag('feat_ai_lead_capture');
  if (blocked) return blocked;

  const limit = rateLimit(`ai:lead-extract:${user.id}`, 10, 60_000);
  if (!limit.ok) return rateLimitResponse(limit);

  const body = await request.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Invalid request: ' + parsed.error.message);
  }
  const { text, currentData } = parsed.data;

  const startedAt = Date.now();
  try {
    const ai = getClient();
    const model = getModel();
    const prompt = buildLeadExtractPrompt(text, currentData);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        maxOutputTokens: 1024,
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });

    const raw = response.text ?? '';
    const result = parseLeadExtractResponse(raw);

    logger.info({
      scope: SCOPE,
      event: 'success',
      userId: user.id,
      role: user.rol,
      extractedKeys: Object.keys(result.extracted),
      missingCount: result.missing.length,
      durationMs: Date.now() - startedAt,
    });

    return Response.json(result);
  } catch (err) {
    logger.error({
      scope: SCOPE,
      event: 'failed',
      userId: user.id,
      durationMs: Date.now() - startedAt,
      err,
    });
    const msg = err instanceof Error ? err.message : 'AI service error';
    return jsonError(msg, 500);
  }
}
