/**
 * POST /api/chat
 *
 * Tool-using chat endpoint. The model has access to ~12 DB tools registered
 * via `registerTools(user, supabase)`. Flow per user message:
 *
 *   1. Build the role-specific system prompt + role context.
 *   2. Loop up to MAX_TURNS:
 *      a. Call generateContent with the running `contents` history.
 *      b. If the response has functionCalls → execute them in parallel via
 *         the dispatcher (RLS-scoped, Zod-validated), append both the
 *         model's call parts and our response parts to `contents`, repeat.
 *      c. Otherwise → take the text response and break.
 *   3. Emit the final text inside the existing SSE envelope so the chat UI
 *      keeps working unchanged.
 *
 * Streaming trade-off: tool-loops are non-streamed (we need the full
 * functionCalls list to decide whether to loop or to finish). The UI's
 * "Pensando…" indicator covers the latency. The final answer is sent as a
 * single SSE chunk + [DONE].
 */

import type { Content, Part } from '@google/genai';
import { z } from 'zod/v4';
import { requireApiAuth, jsonError } from '@/lib/api-utils';
import type { ApiUser } from '@/lib/api-utils';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { assertFeatureFlag } from '@/features/tenant/lib/feature-flag-guard';
import {
  getClient,
  getModel,
  buildRoleContext,
  buildRolePrompt,
  registerTools,
  MAX_TURNS,
} from '@/features/ai-chat/lib/gemini';

const SCOPE = 'api.chat';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string().max(4000),
});

const ChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  history: z.array(MessageSchema).max(20).default([]),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof Response) return auth;
  const user = auth as ApiUser;

  const blocked = await assertFeatureFlag('feat_ai_chat');
  if (blocked) return blocked;

  const limit = rateLimit(`ai:chat:${user.id}`, 20, 60_000);
  if (!limit.ok) return rateLimitResponse(limit);

  const body = await request.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Invalid request: ' + parsed.error.message);
  }
  const { message, history } = parsed.data;

  const startedAt = Date.now();
  try {
    const supabase = await createClient();
    const ctx = await buildRoleContext(user);
    const systemPrompt = buildRolePrompt(ctx);
    const { declarations, dispatch } = registerTools(user, supabase);
    const ai = getClient();
    const model = getModel();

    const contents: Content[] = [
      ...history.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }] as Part[],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    let finalText = '';
    let toolCallsTotal = 0;
    let turnsUsed = 0;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      turnsUsed = turn + 1;

      const res = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          tools: [{ functionDeclarations: declarations }],
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      });

      const calls = res.functionCalls ?? [];

      if (calls.length === 0) {
        finalText = res.text ?? '';
        break;
      }

      toolCallsTotal += calls.length;

      // Echo the model's function-call parts back into the history so the
      // next turn knows what was asked.
      contents.push({
        role: 'model',
        parts: calls.map((fc) => ({ functionCall: fc })),
      });

      // Execute every call in parallel — they're independent reads.
      const responseParts: Part[] = await Promise.all(
        calls.map(async (fc) => {
          const result = await dispatch(fc.name ?? '', fc.args ?? {});
          return {
            functionResponse: {
              id: fc.id,
              name: fc.name,
              response: { result },
            },
          } satisfies Part;
        })
      );

      contents.push({ role: 'user', parts: responseParts });
    }

    if (!finalText) {
      finalText =
        'He alcanzado el límite de análisis sin llegar a una respuesta final. Prueba a reformular la pregunta o a acotarla un poco más.';
    }

    logger.info({
      scope: SCOPE,
      event: 'success',
      userId: user.id,
      role: user.rol,
      turnsUsed,
      toolCallsTotal,
      durationMs: Date.now() - startedAt,
    });

    // Wrap the final text in the same SSE envelope the chat UI already
    // expects (single chunk + DONE).
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text: finalText })}\n\n`)
        );
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
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
