/**
 * Helpers for the chat tool-loop turn handling.
 *
 * The Gemini SDK exposes `res.functionCalls` as a convenience accessor that
 * returns bare `FunctionCall` objects without their `Part` wrapper. When the
 * model reasons before calling a tool, Gemini attaches a `thought_signature`
 * to the function-call part — that signature is required on the next turn or
 * the API rejects the request with `INVALID_ARGUMENT`.
 *
 * To preserve the signature we push the *full* candidate content back into
 * history instead of reconstructing it from `functionCalls`.
 */

import type { Content, FunctionCall, Part } from '@google/genai';

export type ExtractResult = {
  content: Content;
  usedFallback: boolean;
};

export function extractModelTurn(
  candidateContent: Content | undefined,
  fallbackCalls: FunctionCall[],
): ExtractResult {
  if (candidateContent) {
    return { content: candidateContent, usedFallback: false };
  }
  return {
    content: {
      role: 'model',
      parts: fallbackCalls.map((fc) => ({ functionCall: fc })) as Part[],
    },
    usedFallback: true,
  };
}

export const CLOSING_INSTRUCTION =
  '\n\nIMPORTANTE: Has agotado el presupuesto de herramientas. Responde ahora con los datos que ya has recogido en el historial. NO llames más herramientas. Si te faltan datos, dilo abiertamente y propón una pregunta más acotada.';

export type ClosingCaller = (req: {
  model: string;
  contents: Content[];
  config: {
    systemInstruction: string;
    maxOutputTokens: number;
    temperature: number;
  };
}) => Promise<{ text?: string }>;

/**
 * Fires one extra `generateContent` call WITHOUT tools so the model is forced
 * to summarise the data it already gathered. Converts a "budget exhausted"
 * dead-end into a degraded but useful answer.
 *
 * Returns the closing text, or `null` if the model produced nothing.
 */
export async function runClosingCall(
  call: ClosingCaller,
  args: {
    model: string;
    systemPrompt: string;
    contents: Content[];
    maxOutputTokens?: number;
    temperature?: number;
  },
): Promise<string | null> {
  const closing = await call({
    model: args.model,
    contents: args.contents,
    config: {
      systemInstruction: args.systemPrompt + CLOSING_INSTRUCTION,
      maxOutputTokens: args.maxOutputTokens ?? 2048,
      temperature: args.temperature ?? 0.7,
    },
  });
  return closing.text ?? null;
}
