/**
 * Phase 12 — Lead Capture (paste-to-extract).
 *
 * Pure helpers: prompt builder + Zod schema for the structured response. The
 * route (`/api/ai/lead-extract`) wires these to a single Gemini call.
 *
 * Pattern matches `summary/route.ts`: one `generateContent` call, no tools,
 * `responseMimeType: 'application/json'` to get a parseable JSON payload.
 */

import { z } from 'zod/v4';

/** Confidence per field — used as a colored chip in the UI. */
export const ConfidenceLevel = z.enum(['high', 'med', 'low']);
export type Confidence = z.infer<typeof ConfidenceLevel>;

/**
 * Fields we try to extract. Mirrors the lead-modal payload shape (empresa +
 * contacto + deal). Every field is optional so a sparse paste produces a
 * sparse result — the UI then asks follow-up questions for `missing`.
 */
export const LeadFieldsSchema = z.object({
  empresa_nombre: z.string().min(1).optional(),
  fuente_lead: z.string().min(1).optional(),
  provincia: z.string().min(1).optional(),
  categoria: z.string().min(1).optional(),
  contacto_nombre: z.string().min(1).optional(),
  cargo: z.string().min(1).optional(),
  telefono: z.string().min(1).optional(),
  email: z.email().optional(),
  valor: z.number().nonnegative().optional(),
});

export type LeadFields = z.infer<typeof LeadFieldsSchema>;
export type LeadField = keyof LeadFields;

export const LEAD_FIELD_KEYS: LeadField[] = [
  'empresa_nombre',
  'fuente_lead',
  'provincia',
  'categoria',
  'contacto_nombre',
  'cargo',
  'telefono',
  'email',
  'valor',
];

export const LeadExtractResponseSchema = z.object({
  extracted: LeadFieldsSchema,
  confidence: z.record(z.string(), ConfidenceLevel).default({}),
  missing: z.array(z.string()).default([]),
  questions: z.array(z.string().max(160)).max(5).default([]),
});

export type LeadExtractResponse = z.infer<typeof LeadExtractResponseSchema>;

const FIELD_LABELS: Record<LeadField, string> = {
  empresa_nombre: 'nombre de la empresa',
  fuente_lead: 'fuente del lead (web, referido, evento…)',
  provincia: 'provincia',
  categoria: 'categoría / sector',
  contacto_nombre: 'nombre completo del contacto',
  cargo: 'cargo del contacto',
  telefono: 'teléfono',
  email: 'email',
  valor: 'valor estimado del negocio (euros, número entero)',
};

/**
 * Builds the prompt sent to Gemini. `currentData` lets the caller refine an
 * earlier extraction by passing the user's answer to a follow-up question.
 */
export function buildLeadExtractPrompt(
  text: string,
  currentData?: Partial<LeadFields>
): string {
  const fieldList = (Object.keys(FIELD_LABELS) as LeadField[])
    .map((k) => `  - ${k}: ${FIELD_LABELS[k]}`)
    .join('\n');

  const known =
    currentData && Object.keys(currentData).length > 0
      ? `\nDatos ya conocidos (no los pidas, úsalos como contexto):\n${JSON.stringify(currentData, null, 2)}\n`
      : '';

  return `Eres un asistente que extrae datos estructurados para crear un lead en un CRM B2B español.

A partir del TEXTO siguiente, devuelve SOLO un JSON válido con esta forma:
{
  "extracted": { ... },          // los campos que has identificado, omitiendo los que no aparecen
  "confidence": { "campo": "high"|"med"|"low" },  // tu certeza por cada campo extraído
  "missing": ["campo", ...],     // campos importantes que faltan (de la lista de abajo)
  "questions": ["pregunta corta en español", ...]  // máx 3, una por campo crítico que falte
}

Campos posibles:
${fieldList}

Reglas estrictas:
- NUNCA inventes datos. Si no están en el texto, déjalos fuera de "extracted".
- "valor" debe ser un NÚMERO (sin símbolo de moneda). Si el texto dice "30k" → 30000, "1,5M" → 1500000.
- "email" debe ser un email válido o se omite.
- "telefono" mantén el formato del texto (no normalices).
- Las preguntas deben ser conversacionales y breves ("¿Cuál es el email de contacto?", "¿Qué valor estimado le ponemos?").
- Devuelve SOLO el JSON. Sin texto adicional, sin markdown, sin "```json".
${known}
TEXTO:
"""
${text}
"""`;
}

/**
 * Parses the raw model output. Tolerates a leading/trailing fence (some
 * Gemini outputs sneak ```json blocks even when asked not to).
 */
export function parseLeadExtractResponse(raw: string): LeadExtractResponse {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('La IA devolvió una respuesta no parseable.');
  }

  const result = LeadExtractResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error('La IA devolvió un esquema inesperado.');
  }
  return result.data;
}
